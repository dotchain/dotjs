// Copyright (C) 2017 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Replace } from "./replace.js";
import { PathChange } from "./path_change.js";
import { Splice } from "./splice.js";
import { Changes } from "./changes.js";
import { Decoder } from "./decode.js";

/**
 * Move represents shifting a sub-sequence over to a different spot.
 * It can be used with strings or array-like values.
 */
export class Move {
  /**
   * Example: new Move(1, 2, -1) represents removing the slice
   * value.slice(1, 3) and re-inserting it at index 0.
   *
   * @param {Number} offset - index of first element to shift.
   * @param {Number} count - number of elements to shift.
   * @param {Number} distance - how many elements to skip over.
   *
   */
  constructor(offset, count, distance) {
    this.offset = offset;
    this.count = count;
    this.distance = distance;
  }

  /** @returns {Move} - the inverse of the move */
  revert() {
    return new Move(this.offset + this.distance, this.count, -this.distance);
  }

  reverseMerge(c) {
    if (!c) {
      return [null, this];
    }

    if (c instanceof Replace) {
      return this._mergeReplace(c);
    }

    if (c instanceof PathChange) {
      return this._mergePath(c, true);
    }

    if (c instanceof Splice) {
      return this._mergeSplice(c);
    }

    const [left, right] = c.merge(this);
    return [right, left];
  }

  /**
   * Merge another change and return modified version of
   * the other and current change.
   *
   * current + returned[0] and other + returned[1] are guaranteed
   * to result in the same state.
   *
   * @returns {Change[]}
   */
  merge(c) {
    if (!c) {
      return [null, this];
    }

    if (c instanceof Replace) {
      return this._mergeReplace(c);
    }

    if (c instanceof PathChange) {
      return this._mergePath(c, false);
    }

    if (c instanceof Splice) {
      return this._mergeSplice(c);
    }

    if (c instanceof Move) {
      return this._mergeMove(c);
    }

    const [self, cx] = c.reverseMerge(this);
    return [cx, self];
  }

  _mergeReplace(other) {
    const after = other.before.apply(this);
    return [new Replace(after, other.after), null];
  }

  _mergePath(o, reverse) {
    if (o.path == null || o.path.length === 0) {
      if (reverse) {
        return this.reverseMerge(o.change);
      }
      return this.merge(o.change);
    }

    const newPath = this.mapPath(o.path);
    return [new PathChange(newPath, o.change), this];
  }

  _mergeMove(o) {
    if (
      o.offset === this.offset &&
      o.distance === this.distance &&
      o.count === this.count
    ) {
      return [null, null];
    }

    if (
      this.distance === 0 ||
      this.count === 0 ||
      o.distance === 0 ||
      o.count === 0
    ) {
      return [o, this];
    }

    if (
      this.offset >= o.offset + o.count ||
      o.offset >= this.offset + this.count
    ) {
      return this._mergeMoveNoOverlap(o);
    }

    if (
      this.offset <= o.offset &&
      this.offset + this.count >= o.offset + o.count
    ) {
      return this._mergeMoveContained(o);
    }

    if (
      this.offset >= o.offset &&
      this.offset + this.count <= o.offset + o.count
    ) {
      return this.reverseMerge(o);
    }

    if (this.offset < o.offset) {
      return this._mergeMoveRightOverlap(o);
    }

    return this.reverseMerge(o);
  }

  _mergeMoveNoOverlap(o) {
    const dest = this._dest();
    const odest = o._dest();

    if (!this._contains(odest) && !o._contains(dest)) {
      return this._mergeMoveNoOverlapNoDestMixups(o);
    }

    if (this._contains(odest) && o._contains(dest)) {
      return this._mergeMoveNoOverlapMixedDests(o);
    }

    if (o._contains(dest)) {
      return this.reverseMerge(o);
    }

    return this._mergeMoveNoOverlapContainedDest(o);
  }

  _mergeMoveNoOverlapContainedDest(o) {
    const dest = this._dest();
    let odest = o._dest();

    let destx = dest;
    if (dest >= odest && dest <= o.offset) {
      destx += o.count;
    } else if (dest > o.offset && dest <= odest) {
      destx -= o.count;
    }

    const m1 = new Move(this.offset, this.count + o.count, this.distance);
    if (o.offset <= this.offset) {
      m1.offset -= o.count;
    }
    if (destx <= m1.offset) {
      m1.distance = destx - m1.offset;
    } else {
      m1.distance = destx - m1.offset - m1.count;
    }

    const o1 = new Move(o.offset, o.count, o.distance);
    if (o.offset > this.offset && o.offset < dest) {
      o1.offset -= this.count;
    } else if (o.offset >= dest && o.offset < this.offset) {
      o1.offset += this.count;
    }

    odest += this.distance;
    if (odest <= o1.offset) {
      o1.distance = odest - o1.offset;
    } else {
      o1.distance = odest - o1.offset - o1.count;
    }

    return [o1, m1];
  }

  _mergeMoveNoOverlapNoDestMixups(o) {
    const dest = this._dest();
    const odest = o._dest();

    const o1dest =
      odest == dest ? this.offset + this.distance : this._mapPoint(odest);
    const o1 = Move._withDest(this._mapPoint(o.offset), o.count, o1dest);

    const m1dest = o._mapPoint(dest);
    const m1 = Move._withDest(o._mapPoint(this.offset), this.count, m1dest);

    return [o1, m1];
  }

  _mergeMoveNoOverlapMixedDests(o) {
    const dest = this._dest();
    const odest = o._dest();

    const lcount = dest - o.offset;
    const rcount = o.count - lcount;

    const loffset = this.offset + this.distance - lcount;
    const roffset = this.offset + this.distance + this.count;

    const ldistance = odest - this.offset;
    const rdistance = odest - this.offset - this.count;
    const ox = new Changes(
      new Move(loffset, lcount, ldistance),
      new Move(roffset, rcount, rdistance)
    );

    let distance = o.offset - this.offset - this.count;
    if (distance < 0) {
      distance = -(this.offset - o.offset - o.count);
    }
    const offset = o.offset + o.distance - (odest - this.offset);
    const count = this.count + o.count;

    return [ox, new Move(offset, count, distance)];
  }

  _mergeMoveRightOverlap(o) {
    const overlapSize = this.offset + this.count - o.offset;
    const overlapUndo = new Move(o.offset + o.distance, overlapSize, 0);
    const non = new Move(o.offset + overlapSize, o.count - overlapSize, 0);

    if (o.distance > 0) {
      overlapUndo.distance = -o.distance;
      non.distance = o.distance;
    } else {
      overlapUndo.distance = o.count - overlapSize - o.distance;
      non.distance = o.distance - overlapSize;
    }

    const [l, r] = this._mergeMoveNoOverlap(non);
    return [l, new Changes(overlapUndo, r)];
  }

  _mergeMoveContained(o) {
    const odest = o._dest();
    let ox = new Move(o.offset + this.distance, o.count, o.distance);

    if (this.offset <= odest && odest <= this.offset + this.count) {
      return [ox, this];
    }

    if (odest == this._dest()) {
      ox = Move._withDest(ox.offset, ox.count, this.offset + this.distance);
      let offset = this.offset;
      if (o.distance < 0) {
        offset += o.count;
      }
      const distance = o.offset + o.count + o.distance;
      return [ox, Move._withDest(offset, this.count - o.count, distance)];
    }

    ox = Move._withDest(ox.offset, ox.count, this._mapPoint(odest));
    const offset = o._mapPoint(this.offset);
    const distance = o._mapPoint(this._dest());
    return [ox, Move._withDest(offset, this.count - o.count, distance)];
  }

  _mapPoint(idx) {
    if (idx >= this.offset + this.distance && idx <= this.offset) {
      return idx + this.count;
    }

    if (
      idx >= this.offset + this.count &&
      idx < this.offset + this.count + this.distance
    ) {
      return idx - this.count;
    }
    return idx;
  }

  _dest() {
    if (this.distance < 0) {
      return this.offset + this.distance;
    }
    return this.offset + this.distance + this.count;
  }

  _contains(p) {
    return p > this.offset && p < this.offset + this.count;
  }

  _mergeSplice(o) {
    if (
      this.offset >= o.offset &&
      this.offset + this.count <= o.offset + o.before.length
    ) {
      return this._mergeMoveWithinSpliceBefore(o);
    }

    if (
      this.offset <= o.offset &&
      this.offset + this.count >= o.offset + o.before.length
    ) {
      // splice is fully within move sub-sequence
      const ox = new Splice(o.offset + this.distance, o.before, o.after);
      const thisx = new Move(
        this.offset,
        this.count + o.after.length - o.before.length,
        this.distance
      );
      return [ox, thisx];
    }

    if (
      this.offset >= o.offset + o.before.length ||
      o.offset >= this.offset + this.count
    ) {
      return this._mergeMoveOutsideSpliceBefore(o);
    }

    // first undo the intersection and then merge as before
    const rest = new Move(this.offset, this.count, this.distance);
    const undo = new Move(this.offset + this.distance, 0, 0);

    if (this.offset > o.offset) {
      const left = o.offset + o.before.length - this.offset;
      rest.offset += left;
      rest.count -= left;
      undo.count = left;
      if (this.distance < 0) {
        rest.distance -= left;
        undo.distance = this.count - this.distance - left;
      } else {
        undo.distance = -this.distance;
      }
    } else {
      const right = this.offset + this.count - o.offset;
      rest.count -= right;
      undo.count = right;
      undo.offset += rest.count;
      if (this.distance < 0) {
        undo.distance = -this.distance;
      } else {
        rest.distance += right;
        undo.distance = right - this.distance - this.count;
      }
    }

    // distance seems to become -0 in some cases which causes
    // tests to fail
    undo.distance = undo.distance || 0;
    rest.distance = rest.distance || 0;

    const [ox, restx] = rest._mergeMoveOutsideSpliceBefore(o);
    return [new Changes(undo, ox), restx];
  }

  _mergeMoveOutsideSpliceBefore(o) {
    const diff = o.after.length - o.before.length;
    const dest =
      this.distance < 0
        ? this.offset + this.distance
        : this.offset + this.distance + this.count;

    if (dest > o.offset && dest < o.offset + o.before.length) {
      const right = o.offset + o.before.length - dest;
      const oBefore1 = o.before.slice(0, dest - o.offset);
      const oBefore2 = o.before.slice(dest - o.offset, dest - o.offset + right);
      const empty = o.before.slice(0, 0);
      const splice1 = new Splice(o.offset, oBefore1, o.after);
      const splice2 = new Splice(
        this.offset + this.count + this.distance,
        oBefore2,
        empty
      );

      const move = new Move(this.offset, this.count, this.distance);

      if (this.offset < o.offset) {
        splice1.offset -= this.count;
        move.distance += right + diff;
      } else {
        move.distance += right;
        move.offset += diff;
      }
      return [new Changes([splice2, splice1]), move];
    }

    if (dest <= o.offset) {
      if (this.offset > o.offset) {
        const s = new Splice(o.offset + this.count, o.before, o.after);
        const m = new Move(
          this.offset + diff,
          this.count,
          this.distance - diff
        );
        return [s, m];
      }
    } else if (dest >= o.offset + o.before.length) {
      if (this.offset > o.offset) {
        const m = new Move(this.offset + diff, this.count, this.distance);
        return [o, m];
      }
      const s = new Splice(o.offset - this.count, o.before, o.after);
      const m = new Move(this.offset, this.count, this.distance + diff);
      return [s, m];
    }

    return [o, this];
  }

  _mergeMoveWithinSpliceBefore(o) {
    const dest =
      this.distance > 0
        ? this.offset + this.count + this.distance
        : this.offset + this.distance;

    if (dest >= o.offset && dest <= o.offset + o.before.length) {
      const oBefore = o.before.apply(
        new Move(this.offset - o.offset, this.count, this.distance)
      );
      return [new Splice(o.offset, oBefore, o.after), null];
    }

    const empty = o.before.slice(0, 0);
    const slice = o.before.slice(
      this.offset - o.offset,
      this.offset - o.offset + this.count
    );
    const spliced = o.before.apply(
      new Splice(this.offset - o.offset, slice, empty)
    );

    if (this.distance < 0) {
      const other = new Splice(dest, empty, slice);
      const self = new Splice(o.offset + this.count, spliced, o.after);
      return [self, other];
    }

    const other = new Splice(
      dest + o.after.length - o.before.length,
      empty,
      slice
    );
    const self = new Splice(o.offset, spliced, o.after);
    return [self, other];
  }

  mapPath(path) {
    const idx = path[0];
    if (idx >= this.offset && idx < this.offset + this.count) {
      return [idx + this.distance].concat(path.slice(1));
    }

    if (this.distance > 0) {
      const e = this.offset + this.count + this.distance;
      if (idx >= this.offset + this.count && idx < e) {
        return [idx - this.count].concat(path.slice(1));
      }
    } else if (idx >= this.offset + this.distance && idx < this.offset) {
      return [idx + this.count].concat(path.slice(1));
    }

    return path;
  }

  toJSON() {
    return [this.offset, this.count, this.distance];
  }

  static typeName() {
    return "changes.Move";
  }

  static fromJSON(decoder, json) {
    return new Move(json[0], json[1], json[2]);
  }

  static _withDest(offset, count, dest) {
    let distance = dest - offset - count;
    if (distance < 0) {
      distance = dest - offset;
    }
    return new Move(offset, count, distance);
  }
}

Decoder.registerChangeClass(Move);
