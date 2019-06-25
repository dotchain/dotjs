/** Value is the base class for values.
 *
 * It should not be used directly but by subclassing.
 * Subclasses should implement clone(), toJSON(), static typeName() as
 * well as static fromJSON and optionally override apply().
 */
class Value {
  constructor() {
    this.stream = null;
  }

  /**
   * replace substitutes this with another value
   * @returns {Value} r - r has same stream as this
   **/
  replace(replacement) {
    const change = new Replace(this.clone(), replacement.clone());
    const version = this.stream && this.stream.append(change);
    return this._nextf(change, version).version;
  }

  /** @type {Object} null or {change, version} */
  get next() {
    const n = this.stream && this.stream.next;
    if (!n) return null;
    return this._nextf(n.change, n.version);
  }

  _nextf(change, version) {
    const v = this.apply(change);
    v.stream = version;
    return { change, version: v };
  }

  /** default apply only supports Replace */
  apply(c) {
    if (!c) {
      return this.clone();
    }

    if (c instanceof Replace) {
      return c.after;
    }

    return c.applyTo(this);
  }
}

/**
 * Stream tracks all future changes to a particular value.
 *
 * Use the next property to check if there is a subsequent change.
 *
 * The next property is null if there is no further change yet. It is
 * an object `{change, version}` where change refers to the actual
 * change and version refers to the next stream instance (with its own
 * next field if there are further changes).
 *
 * The whole stream is effectively immutable with the next field only
 * ever getting written to once when a new version happens. If more
 * changes are made on the current stream, those versions are tacked
 * on at the end of the next version (with the changes appropriately
 * factoring all other changes),
 *
 * Streams are convergent: chasing the next pointer of any stream
 * instance in a particular stream will converge (i.e applying the
 * changes will end up with same value even if the changes themselves
 * are a little different).
 *
 */
class Stream {
  constructor() {
    this.next = null;
  }

  /* push commits any changes upstream */
  push() {
    return this;
  }

  /* pull fetches any upstream changes which will be avilable via next */
  pull() {
    return this;
  }

  /* undo reverts the last change on the underlying stream which could
   * be a parent stream. The last change may not really affect the
   * current stream directly.
   *
   * Normal streams do not support undo but a stream created via
   *`undoable` (and all its descendant streams/sub-streams) support
   * undo.
   */
  undo() {
    return this;
  }

  /* redo reapplies the last change that got reverted by undo */
  redo() {
    return this;
  }

  /* append adds a local change */
  append(c) {
    return this._appendChange(c, false);
  }

  /* reverseAppend adds an *upstream* change; meant to be used by nw
   * synchronizers */
  reverseAppend(c) {
    return this._appendChange(c, true);
  }

  _appendChange(c, reverse) {
    const result = new Stream();
    let s = this;
    let nexts = result;
    while (s.next !== null) {
      let { change, version } = s.next;
      s = version;

      [c, change] = this._merge(change, c, reverse);
      nexts.next = { change, version: new Stream() };
      nexts = nexts.next.version;
    }
    s.next = { change: c, version: nexts };
    return result;
  }

  _merge(left, right, reverse) {
    if (left === null || right === null) {
      return [right, left];
    }

    if (!reverse) {
      return left.merge(right);
    }

    [right, left] = right.merge(left);
    return [left, right];
  }
}

const noCache = {};

/** DerivedStream is a base class for all derived streams */
class DerivedStream {
  constructor(parent) {
    this.parent = parent;
    this._next = noCache;
  }

  append(c) {
    return this.parent.append(c);
  }

  reverseAppend(c) {
    return this.parent.reverseAppend(c);
  }

  push() {
    this.parent.push();
    return this;
  }

  pull() {
    this.parent.pull();
    return this;
  }

  undo() {
    this.parent.undo();
    return this;
  }

  redo() {
    this.parent.redo();
    return this;
  }

  get next() {
    if (this._next !== noCache) {
      return this._next;
    }

    const next = this._getNext();
    if (next) {
      this._next = next;
    }
    return next;
  }
}

/** Implements a collection of change values */
class Changes {
  /** @param {...Change|Change[]} changes - sequentially combine changes */
  constructor(...changes) {
    this._all = [];
    for (let cx of changes) {
      if (cx instanceof Changes) {
        cx = cx._all;
      }
      if (!Array.isArray(cx)) {
        cx = [cx];
      }
      for (let c of cx) {
        this._all.push(c);
      }
    }
  }

  /** @returns {Changes} - the inverse of the collection */
  revert() {
    let result = [];
    for (let kk = this._all.length - 1; kk >= 0; kk--) {
      const c = this._all[kk] && this._all[kk].revert();
      if (c) {
        result.push(c);
      }
    }
    return Changes.create(result);
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
  merge(other) {
    if (other == null) {
      return [null, this];
    }

    let result = [];
    for (let c of this._all) {
      if (c !== null) {
        [other, c] = c.merge(other);
      }
      if (c !== null) {
        result.push(c);
      }
    }
    return [other, Changes.create(result)];
  }

  reverseMerge(other) {
    if (other == null) {
      return [null, this];
    }

    let result = [];
    for (let c of this._all) {
      if (other != null) {
        [c, other] = other.merge(c);
      }
      if (c !== null) {
        result.push(c);
      }
    }
    return [other, Changes.create(result)];
  }

  applyTo(value) {
    for (let c of this._all) {
      value = value.apply(c);
    }
    return value;
  }

  *[Symbol.iterator]() {
    for (let c of this._all) {
      yield c;
    }
  }

  toJSON() {
    return Encoder.encodeArrayValue(this._all);
  }

  static typeName() {
    return "changes.ChangeSet";
  }

  static fromJSON(decoder, json) {
    if (json) {
      json = json.map(elt => decoder.decodeChange(elt));
    }
    return Changes.create(json);
  }

  static create(elts) {
    return (elts && elts.length && new Changes(elts)) || null;
  }
}

/**
 * Conn creates a network connection or use with Session. See {@link Transformer}.
 */
class Conn {
  /**
   * @param {string} url - url to post requests to
   * @param {function} fetch - window.fetch implementation or polyfill
   */
  constructor(url, fetch) {
    this._request = Conn._request.bind(null, url, fetch);
    this._limit = 1000;
    this._duration = 30 * 1000 * 1000 * 1000;
  }

  /** withPollMilliseconds specifies poll interval to pass on to server */
  withPollMilliseconds(ms) {
    this._duration = ms * 1000 * 1000;
    return this;
  }

  /**
   * write ops using fetch
   * @param [Operation[]] ops - ops to write
   * @returns {Promise}
   */
  write(ops) {
    return this._request(new AppendRequest(ops));
  }

  /**
   * read ops using fetch
   * @param [int] version - version of op to start fetching from
   * @param [limit] limit - max number of ops to fetch
   * @param [duration] duration - max long poll interval to pass to server
   * @returns {Promise}
   */
  read(version, limit, duration) {
    duration = duration || this._duration;
    return this._request(new GetSinceRequest(version, limit, duration));
  }

  static async _request(url, fetch, req) {
    const headers = { "Content-Type": " application/x-sjson" };
    const body = JSON.stringify(Encoder.encode(req));

    const res = await fetch(url, { method: "POST", body, headers });
    if (!res.ok) {
      return Promise.reject(new Error(res.status + " " + res.statusText));
    }
    const json = await res.json();
    const r = Response.fromJSON(new Decoder(), json[Response.typeName()]);
    if (r.err) {
      return Promise.reject(r.err);
    }

    return (r.ops && r.ops.length && r.ops) || null;
  }
}

const valueTypes = {};
const changeTypes = {};

class Decoder {
  decode(value) {
    if (value === undefined || value === null) {
      return null;
    }

    for (let key in value) {
      switch (key) {
        case "bool":
          return value.bool;
        case "int":
          return value.int;
        case "float64":
          return +value.float64;
        case "string":
          return value.string;
        case "time.Time":
          return new Date(value[key]);
      }
    }

    const val = this.decodeValue(value);
    if (val !== undefined) {
      return val;
    }

    return this.decodeChange(value);
  }

  decodeValue(v) {
    for (let key in v) {
      if (valueTypes.hasOwnProperty(key)) {
        return valueTypes[key].fromJSON(this, v[key]);
      }
    }
  }

  decodeChange(c) {
    if (c === null) {
      return null;
    }

    for (let key in c) {
      if (changeTypes.hasOwnProperty(key)) {
        return changeTypes[key].fromJSON(this, c[key]);
      }
    }
  }

  // registerValueClass registers value types. This is needed
  // for encoding/decoding value types
  //
  // Value classes should include a static method typeName() which
  // provides the associated golang type
  static registerValueClass(valueConstructor) {
    valueTypes[valueConstructor.typeName()] = valueConstructor;
  }

  // registerChangeClass registers change types. This is needed
  // for encoding/decoding change types
  //
  // Change classes should include a static method typeName() which
  // provides the associated golang type
  static registerChangeClass(changeConstructor) {
    changeTypes[changeConstructor.typeName()] = changeConstructor;
  }
}

/** Dict represents a map/hash/dictionary/collection with string keys */
class Dict extends Value {
  constructor(initial, defaultFn) {
    super();
    this.map = initial || {};
    this._defaultFn = defaultFn || (() => new Null());
  }

  setDefaultFn(defaultFn) {
    this._defaultFn = defaultFn || (() => new Null());
  }

  /** get looks up a key and returns the value (or a default value) */
  get(key) {
    const val = this.map[key] || this._defaultFn();
    val.stream = new Substream(this.stream, key);
    return val;
  }

  /** clone makes a copy but with stream set to null */
  clone() {
    return new Dict(this.map);
  }

  apply(c) {
    if (!c) {
      return this.clone();
    }

    if (c instanceof Replace) {
      return c.after;
    }

    if (c instanceof PathChange) {
      if (c.path === null || c.path.length === 0) {
        return this.apply(c.change);
      }
      return this._applyPath(c.path, c.change);
    }

    return c.applyTo(this);
  }

  _applyPath(path, c) {
    let val = this.map[path[0]] || this._defaultFn();
    val = val.apply(new PathChange(path.slice(1), c));
    const clone = {};
    for (let key in this.map) {
      clone[key] = this.map[key];
    }
    if (val instanceof Null) {
      delete (clone, path[0]);
    } else {
      clone[path[0]] = val;
    }
    return new Dict(clone);
  }

  toJSON() {
    let all = [];
    for (let key in this.map) {
      all.push(key, Encoder.encode(this.map[key]));
    }
    return all;
  }

  static typeName() {
    return "types.Dict";
  }

  static fromJSON(decoder, json) {
    json = json || [];
    const map = {};
    for (let kk = 0; kk < json.length; kk += 2) {
      map[json[kk]] = decoder.decodeValue(json[kk + 1]);
    }
    return new Dict(map);
  }
}

Decoder.registerValueClass(Dict);

class Encoder {
  static encode(value) {
    if (value === undefined || value === null) {
      return null;
    }

    if (value && value.constructor && value.constructor.typeName) {
      return { [value.constructor.typeName()]: value };
    }

    if (value instanceof Date) {
      return { "time.Time": Encoder.encodeDateValue(value) };
    }

    value = value.valueOf();
    switch (typeof value) {
      case "boolean":
        return { bool: Encoder.encodeBoolValue(value) };
      case "number":
        return Encoder.encodeNumber(value);
      case "string":
        return { string: value };
    }
  }

  static encodeBoolValue(b) {
    return b.valueOf();
  }

  static encodeNumber(i) {
    if (Number.isSafeInteger(i)) {
      return { int: i };
    }
    return { float64: i.toString() };
  }

  static encodeDateValue(date) {
    const pad = (n, width) => n.toString().padStart(width, "0");
    const offset = date.getTimezoneOffset();
    return (
      pad(date.getFullYear(), 4) +
      "-" +
      pad(date.getMonth() + 1, 2) +
      "-" +
      pad(date.getDate(), 2) +
      "T" +
      pad(date.getHours(), 2) +
      ":" +
      pad(date.getMinutes(), 2) +
      ":" +
      pad(date.getSeconds(), 2) +
      "." +
      pad(date.getMilliseconds(), 3) +
      (offset > 0 ? "-" : "+") +
      pad(Math.floor(Math.abs(offset) / 60), 2) +
      ":" +
      pad(Math.abs(offset) % 60, 2)
    );
  }

  static encodeArrayValue(a) {
    if (a === undefined || a === null) {
      return null;
    }

    return a.map(Encoder.encode);
  }
}

const encode = Encoder.encode;

function field(store, obj, key) {
  return new FieldStream(store, run(store, obj), run(store, key), null).value;
}

class FieldStream extends DerivedStream {
  constructor(store, obj, key, value) {
    if (!value) {
      if (!key.text) {
        value = new Null();
      } else if (obj.collection) {
        value = obj.collection(key.text);
      } else if (obj.get) {
        value = obj.get(key.text);
      } else {
        value = new Null();
      }
    }

    super(value.stream);

    value = value.clone();
    value.stream = this;
    this.value = value;
    this.store = store;
    this.obj = obj;
    this.key = key;
  }

  _getNext() {
    const n = this.store.next;
    if (n) {
      this.store = n.version;
    }

    const objn = this.obj.next;
    const keyn = this.key.next;
    if (objn || keyn) {
      const obj = objn ? objn.version : this.obj;
      const key = keyn ? keyn.version : this.key;
      const updated = new FieldStream(this.store, obj, key, null).value;
      const change = new Replace(this.value.clone(), updated.clone());
      return { change, version: updated.stream };
    }

    const valuen = this.parent && this.parent.next;
    if (valuen) {
      // runuated value has changed
      const version = new FieldStream(
        this.store,
        this.obj,
        this.key,
        valuen.version
      );
      return { change: valuen.change, version };
    }

    return null;
  }
}

class Field extends Value {
  invoke(store, args) {
    const obj = field(store, args, new Text("obj"));
    const key = field(store, args, new Text("field"));
    return field(store, obj, key);
  }

  toJSON() {
    return null;
  }

  static typeName() {
    return "fns.Field";
  }

  static fromJSON() {
    return new FieldFn();
  }
}

Decoder.registerValueClass(Field);

/**
 * Move represents shifting a sub-sequence over to a different spot.
 * It can be used with strings or array-like values.
 */
class Move {
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

/** Null represents an empty value */
class Null extends Value {
  /** clone makes a copy but with stream set to null */
  clone() {
    return new Null();
  }

  toJSON() {
    return null;
  }

  static typeName() {
    return "changes.empty";
  }

  static fromJSON() {
    return new Null();
  }
}

/** Num represents a generic numeric type */
class Num extends Value {
  constructor(num) {
    super();
    this.n = parseFloat(+num);
    if (isNaN(n) || !isFinite(n)) {
      throw new Error("not a number: " + num);
    }
  }

  /** clone makes a copy but with stream set to null */
  clone() {
    return new Num(this.n);
  }

  toJSON() {
    return Encoder.encode(this.n);
  }

  static typeName() {
    return "types.Num";
  }

  static fromJSON(decoder, json) {
    return new Num(json);
  }
}

Decoder.registerValueClass(Num);

let getRandomValues = null;

if (typeof crypto !== "undefined") {
  getRandomValues = b => crypto.getRandomValues(b);
}

/** Operation is the change and metadata needed for network transmission */
class Operation {
  /**
   * @param {string} [id] - the id is typically auto-generated.
   * @param {string} [parentId] - the id of the previous unacknowledged local op.
   * @param {int} [version] - the zero-based index is updated by the server.
   * @param {int} basis -- the version of the last applied acknowledged op.
   * @param {Change} changes -- the actual change being sent to the server.
   */
  constructor(id, parentId, version, basis, changes) {
    this.id = id || Operation.newId();
    this.parentId = parentId;
    this.version = version;
    this.basis = basis;
    this.changes = changes;
  }

  toJSON() {
    const unencoded = [this.id, this.parentId, this.changes];
    const [id, parentId, c] = Encoder.encodeArrayValue(unencoded);
    return [id, parentId, this.version, this.basis, c];
  }

  merge(otherOp) {
    if (!this.changes) {
      return [otherOp, this];
    }

    const [l, r] = this.changes.merge(otherOp.changes);
    return [otherOp.withChanges(l), this.withChanges(r)];
  }

  withChanges(c) {
    return new Operation(this.id, this.parentId, this.version, this.basis, c);
  }

  static typeName() {
    return "ops.Operation";
  }

  static fromJSON(decoder, json) {
    const [id, parentId, version, basis, changes] = json;
    return new Operation(
      decoder.decode(id),
      decoder.decode(parentId),
      version,
      basis,
      decoder.decodeChange(changes)
    );
  }

  static newId() {
    const bytes = new Uint8Array(16);
    getRandomValues(bytes);
    const toHex = x => ("00" + x.toString(16)).slice(-2);
    return Array.prototype.map.call(bytes, toHex).join("");
  }

  /*
   * useCrypto should be used to provide the polyfill for crypto
   * @param [Object] crypto - the crypto module
   * @param [function] cyrpto.randomFillSync -- this is only function used here
   */
  static useCrypto(crypto) {
    getRandomValues = crypto.randomFillSync;
  }
}

/** PathChange represents an embedded value changing at the specified path. */
class PathChange {
  /**
   * The path is a sequence of index or key name to refer to the embeded value.
   *
   * Example: root.rows[3] will have path ["rows", 3].
   *
   * @param {Any[]} path - path to inner value.
   * @param {Change} change - any change applied to inner value at path.
   */
  constructor(path, change) {
    if (path == undefined) {
      path = null;
    }
    if (change === undefined) {
      change = null;
    }

    this.path = path;
    this.change = change;
  }

  /** @returns {Change} - the inverse of this change */
  revert() {
    if (this.change == null) {
      return null;
    }

    return PathChange.create(this.path, this.change.revert());
  }

  reverseMerge(other) {
    if (this.path === null || this.path.length === 0) {
      const [left, right] = other.merge(this.change);
      return [right, left];
    }

    if (other instanceof Replace) {
      const before = other.before.apply(this);
      return [new Replace(before, other.after), null];
    }
    throw new Error("unexpected PathChange.reverseMerge");
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
  merge(other) {
    if (other == null) {
      return [null, this];
    }

    if (this.change == null) {
      return [other, null];
    }

    if (this.path == null) {
      return this.change.merge(other);
    }

    if (!(other instanceof PathChange)) {
      other = new PathChange(null, other);
    }

    const len = PathChange.commonPrefixLen(this.path, other.path);
    const ownLen = (this.path && this.path.length) || 0;
    const otherLen = (other.path && other.path.length) || 0;

    if (len != ownLen && len != otherLen) {
      return [other, this];
    }

    if (len == ownLen && len == otherLen) {
      const [left, right] = this.change.merge(other.change);
      return [
        PathChange.create(other.path, left),
        PathChange.create(this.path, right)
      ];
    }

    if (len == ownLen) {
      const [left, right] = this.change.merge(
        PathChange.create(other.path.slice(len), other.change)
      );
      return [
        PathChange.create(this.path, left),
        PathChange.create(this.path, right)
      ];
    }

    const [left, right] = other.merge(this);
    return [right, left];
  }

  applyTo(value) {
    if (this.path === null || this.path.length === 0) {
      return value.apply(this.change);
    }
    throw new Error("Unexpected use of PathChange.applyTo");
  }

  toJSON() {
    const path = Encoder.encodeArrayValue(this.path);
    return [path, Encoder.encode(this.change)];
  }

  static typeName() {
    return "changes.PathChange";
  }

  static fromJSON(decoder, json) {
    let path = json[0];

    if (path !== null) {
      path = path.map(x => decoder.decode(x));
    }

    const change = decoder.decodeChange(json[1]);
    return new PathChange(path, change);
  }

  static commonPrefixLen(p1, p2) {
    if (p1 == null || p2 == null) {
      return 0;
    }
    let len = 0;
    for (; len < p1.length && len < p2.length; len++) {
      const encode = x => Encoder.encode(x);
      if (JSON.stringify(encode(p1[len])) != JSON.stringify(encode(p2[len]))) {
        return len;
      }
    }
    return len;
  }

  static create(path, change) {
    if (path == null || path.length == 0) {
      return change;
    }
    if (change == null) {
      return null;
    }
    if (change instanceof PathChange) {
      const otherPath = change.path || [];
      return this.create(path.concat(otherPath), change.change);
    }
    return new PathChange(path, change);
  }
}

/** Ref represents a reference to a path */
class Ref extends Value {
  constructor(path) {
    super();
    this._path = path;
  }

  /** clone makes a copy but with stream set to null */
  clone() {
    return new Ref(this._path);
  }

  /** run returns the underlying value at the path */
  run(store) {
    return store.resolve(this._path);
  }

  toJSON() {
    return JSON.stringify(this._path);
  }

  static typeName() {
    return "types.Ref";
  }

  static fromJSON(decoder, json) {
    return new Ref(JSON.parse(json));
  }
}

/** Replace represents a change one value to another **/
class Replace {
  /**
   * before and after must be valid Value types (that implement apply()).
   *
   * @param {Value} before - the value as it was before.
   * @param {Value} after - the value as it is after.
   */
  constructor(before, after) {
    this.before = before;
    this.after = after;
  }

  /** @returns {Replace} - the inverse of the replace */
  revert() {
    return new Replace(this.after, this.before);
  }

  _isDelete() {
    return this.after.constructor.typeName() == "changes.empty";
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
  merge(other) {
    if (other == null) {
      return [null, this];
    }
    if (other instanceof Replace) {
      return this._mergeReplace(other);
    }
    const [left, right] = other.reverseMerge(this);
    return [right, left];
  }

  _mergeReplace(other) {
    if (this._isDelete() && other._isDelete()) {
      return [null, null];
    }
    return [new Replace(this.after, other.after), null];
  }

  toJSON() {
    return Encoder.encodeArrayValue([this.before, this.after]);
  }

  static typeName() {
    return "changes.Replace";
  }

  static fromJSON(decoder, json) {
    const before = decoder.decodeValue(json[0]);
    const after = decoder.decodeValue(json[1]);
    return new Replace(before, after);
  }
}

class Request {
  constructor(name, ops, version, limit, duration) {
    this.name = name;
    this.ops = ops;
    this.version = version;
    this.limit = limit;
    this.duration = duration;
  }

  toJSON() {
    const ops = Encoder.encodeArrayValue(this.ops);
    return [this.name, ops, this.version, this.limit, this.duration];
  }

  static typeName() {
    return "ops/nw.request";
  }

  static fromJSON(decoder, json) {
    const [name, ops, version, limit, duration] = json;
    const opx = (ops || []).map(op =>
      Operation.fromJSON(decoder, op[Operation.typeName()])
    );
    if (name == "Append") {
      return new AppendRequest(opx);
    } else {
      return new GetSinceRequest(version, limit, duration);
    }
  }
}

class AppendRequest extends Request {
  constructor(ops) {
    super("Append", ops, -1, -1, 0);
  }
}

class GetSinceRequest extends Request {
  constructor(version, limit, duration) {
    super("GetSince", null, version, limit, duration);
  }
}

class Response {
  constructor(ops, err) {
    this.ops = ops || [];
    this.err = err || null;
  }

  toJSON() {
    let err = null;
    if (this.err) {
      const s = this.err.toString().replace("Error: ", "");
      err = { "ops/nw.strError": s };
    }

    return [Encoder.encodeArrayValue(this.ops || []), err];
  }

  static typeName() {
    return "ops/nw.response";
  }

  static fromJSON(decoder, json) {
    const err = (json[1] && new Error(json[1]["ops/nw.strError"])) || null;
    const decode = op => Operation.fromJSON(decoder, op[Operation.typeName()]);
    return new Response((json[0] || []).map(decode), err);
  }
}

function run(store, obj) {
  return new RunStream(store, obj, null).value;
}

class RunStream extends DerivedStream {
  constructor(store, obj, value) {
    if (!value) {
      value = obj;
      if (value.run) {
        value = run(store, value.run(store));
      }
    }

    super(value.stream);

    value = value.clone();
    value.stream = this;
    this.value = value;

    this.store = store;
    this.obj = obj;
  }

  _getNext() {
    const n = this.store.next;
    if (n) {
      this.store = n.version;
    }

    const objn = this.obj.next;
    if (objn) {
      // object definition has changed
      const updated = run(this.store, objn.version);
      const change = new Replace(this.value.clone(), updated.clone());
      return { change, version: updated.stream };
    }

    const valuen = this.parent && this.parent.next;
    if (valuen) {
      // runuated value has changed
      const version = new RunStream(this.store, this.obj, valuen.version);
      return { change: valuen.change, version };
    }

    return null;
  }
}

/**
 * Splice represents the change to replace a sub-sequence with another.
 * It can be used with strings or array-like values.
 */
class Splice {
  /**
   * @param {Number} offset -- where the sub-sequence starts.
   * @param {Value} before -- the subsequnce as it was before.
   * @param {Value} value - the subsequence as it is after.
   */
  constructor(offset, before, after) {
    this.offset = offset;
    this.before = before;
    this.after = after;
  }

  revert() {
    return new Splice(this.offset, this.after, this.before);
  }

  reverseMerge(other) {
    if (other == null) {
      return [null, this];
    }
    if (other instanceof Replace) {
      return this._mergeReplace(other);
    }

    if (other instanceof Splice) {
      const [left, right] = other._mergeSplice(this);
      return [right, left];
    }

    if (other instanceof PathChange) {
      return this._mergePath(other, true);
    }

    const [self, otherx] = other.reverseMerge(this);
    return [otherx, self];
  }

  merge(other) {
    if (other == null) {
      return [null, this];
    }

    if (other instanceof Replace) {
      return this._mergeReplace(other);
    }

    if (other instanceof Splice) {
      return this._mergeSplice(other);
    }

    if (other instanceof PathChange) {
      return this._mergePath(other, false);
    }
    const [left, right] = other.reverseMerge(this);
    return [right, left];
  }

  _mergePath(o, reverse) {
    if (o.path == null || o.path.length === 0) {
      if (reverse) {
        return this.reverseMerge(o.change);
      }
      return this.merge(o.change);
    }

    const newPath = this.mapPath(o.path);
    if (newPath == null) {
      const p = [o.path[0] - this.offset].concat(o.path.slice(1));
      const before = this.before.apply(new PathChange(p, o.change));
      return [null, new Splice(this.offset, before, this.after)];
    }
    return [new PathChange(newPath, o.change), this];
  }

  mapPath(path) {
    const idx = path[0];
    if (idx < this.offset) {
      return path;
    }

    if (idx >= this.offset + this.before.length) {
      const idx2 = idx + this.after.length - this.before.length;
      return [idx2].concat(path.slice(1));
    }

    // path obliterated
    return null;
  }

  _mergeSplice(o) {
    if (Splice._end(this) <= o.offset) {
      // [ ] < >
      const offset = o.offset + Splice._diff(this);
      const other = new Splice(offset, o.before, o.after);
      return [other, this];
    }

    if (Splice._end(o) <= this.offset) {
      // < > [ ]
      const offset = this.offset + Splice._diff(o);
      const updated = new Splice(offset, this.before, this.after);
      return [o, updated];
    }

    if (this.offset < o.offset && Splice._end(this) < Splice._end(o)) {
      // [ < ] >
      const oOffset = this.offset + this.after.length;
      const end = Splice._end(this);
      const oBefore = o.before.slice(end - o.offset, o.before.length);
      const before = this.before.slice(0, o.offset - this.offset);
      return [
        new Splice(oOffset, oBefore, o.after),
        new Splice(this.offset, before, this.after)
      ];
    }

    if (this.offset == o.offset && this.before.length < o.before.length) {
      // <[ ] >
      const oBefore = o.before.slice(this.before.length, o.before.length);
      const oOffset = o.offset + this.after.length;
      const other = new Splice(oOffset, oBefore, o.after);

      return [
        other,
        new Splice(this.offset, this.before.slice(0, 0), this.after)
      ];
      // golang behavior is below
      // const oBefore = o.before.apply(new Splice(0, this.before, this.after));
      // return [new Splice(o.offset, oBefore, o.after), null];
    }

    if (this.offset <= o.offset && Splice._end(this) >= Splice._end(o)) {
      // [ < > ]
      const diff = o.offset - this.offset;
      const slice = this.before.slice(diff, diff + o.before.length);
      const before = this.before.apply(new Splice(diff, slice, o.after));
      return [null, new Splice(this.offset, before, this.after)];
    }

    if (this.offset > o.offset && Splice._end(this) <= Splice._end(o)) {
      // < [ ]>
      const diff = this.offset - o.offset;
      const slice = o.before.slice(diff, diff + this.before.length);
      const oBefore = o.before.apply(
        new Splice(this.offset - o.offset, slice, this.after)
      );
      return [new Splice(o.offset, oBefore, o.after), null];
    }

    // < [ > ]
    const oBefore = o.before.slice(0, this.offset - o.offset);
    const offset = o.offset + o.after.length;
    const before = this.before.slice(
      Splice._end(o) - this.offset,
      this.before.length
    );
    return [
      new Splice(o.offset, oBefore, o.after),
      new Splice(offset, before, this.after)
    ];
  }

  _mergeReplace(other) {
    const after = other.before.apply(this);
    return [new Replace(after, other.after), null];
  }

  toJSON() {
    return [
      this.offset,
      Encoder.encode(this.before),
      Encoder.encode(this.after)
    ];
  }

  static typeName() {
    return "changes.Splice";
  }

  static fromJSON(decoder, json) {
    const before = decoder.decodeValue(json[1]);
    const after = decoder.decodeValue(json[2]);
    return new Splice(json[0], before, after);
  }

  static _end(s) {
    return s.offset + s.before.length;
  }

  static _diff(s) {
    return s.after.length - s.before.length;
  }
}

/** Store implements a collection of tables with ability to sync via a
 * connection */
class Store {
  /**
   * @param {Conn|Transformer|string} conn - can be url or Conn
   * @param {Object} serialized? - output of prev serialze() call
   */
  constructor(conn, serialized) {
    const data = serialized || { root: [], session: { version: -1 } };
    if (typeof fetch == "function" && typeof conn == "string") {
      conn = new Transformer(new Conn(conn, fetch));
    }
    this._conn = conn;
    this._root = Dict.fromJSON(new Decoder(), data.root);

    // setup the stream
    this._root.stream = new Stream();

    // All root collections are "implict" and get created on access
    this._root.setDefaultFn(() => new Dict());
    this._session = {
      stream: this._root.stream,
      version: data.session.version,
      pending: (data.session.pending || []).slice(0),
      merge: (data.session.merge || []).slice(0),
      reading: null,
      writing: null,

      // not yet pushed to server
      unsent: (data.session.pending || []).slice(0),
      // have received from server but not applied to model yet
      unmerged: []
    };
  }

  /** collection returns a collection by name */
  collection(name) {
    return this._root.get(name);
  }

  /** resolve returns the value at the path */
  resolve(path) {
    let result = this;
    for (let key of path) {
      if (result instanceof Null) {
        result.stream = new Substream(result.stream, key);
      } else if (result.get) {
        result = result.get(key);
      } else if (result.collection) {
        result = result.collection(key);
      } else {
        return new Null();
      }
    }
    return result;
  }

  /** @type {Object} null or {change, version} */
  get next() {
    const n = this._root.next;
    if (!n) {
      return null;
    }

    const store = new Store(this._conn, null);
    store._root = n.version;
    store._session = this._session;
    return { change: n.change, version: store };
  }

  pull() {
    const s = this._session;

    // apply server operations
    for (let op of s.unmerged) {
      if (s.pending.length && s.pending[0].id == op.id) {
        // ack
        s.pending.shift();
        s.merge.shift();
      } else {
        for (let kk = 0; kk < s.meerge.length; kk++) {
          [s.merge[kk], op] = op.merge(s.merge[kk]);
        }
        s.stream = s.stream.reverseAppend(op.changes);
      }
      s.version = op.version;
    }

    // read more operations
    if (!s.reading) {
      s.reading = this._conn.read(s.version + 1, 1000).then(ops => {
        s.unmerged = s.unmerged.concat(ops || []);
        s.reading = null;
      });
    }
    return s.reading;
  }

  push() {
    const s = this._session;

    // collect all pending activity on the root stream
    const len = (s.pending || []).length;
    let pid = len > 0 ? s.pending[len - 1].id : null;
    for (let next = str.next; next != null; next = next.version.next) {
      const op = new Operation(null, pid, -1, this._version, next.change);
      s.unsent.push(op);
      s.pending.push(op);
      s.stream = next.version;
    }

    // write to connection
    if (!s.writing) {
      const ops = s.unsent.slice(0);
      if (len(ops) == 0) {
        return Promise.resolve(null);
      }

      s.writing = this._conn.write(ops).then(() => {
        for (let op of ops) {
          s.unsent.shift();
        }
        s.writing = null;
      });
    }
    return s.writing;
  }

  serialize() {
    const { version, pending, merge } = this._session;
    const session = { version, pending, merge };
    return { root: this._root.toJSON(), session };
  }
}

const sentinel = {};

/* Substream refers to a field embedded within a container stream */
class Substream {
  constructor(parent, key) {
    this.parent = parent;
    this.key = key;
    this._next = sentinel;
  }

  append(c) {
    return this.parent.append(new PathChange([this.key], c));
  }

  reverseAppend(c) {
    return this.parent.reverseAppend(new PathChange([this.key], c));
  }

  get next() {
    if (this._next !== sentinel) {
      return this._next;
    }

    const n = this.parent.next ? getNext(this) : null;
    if (n != null) {
      this._next = n;
    }

    return n;
  }

  push() {
    this.parent.push();
    return this;
  }

  pull() {
    this.parent.pull();
    return this;
  }

  undo() {
    this.parent.undo();
    return this;
  }

  redo() {
    this.parent.redo();
    return this;
  }
}

function getNext(s) {
  const next = s.parent.next;
  const { xform, key, ok } = transform(next.change, s.key);
  if (!ok) {
    return null;
  }

  return { change: xform, version: new Substream(next.version, key) };
}

function transform(c, key) {
  if (c === null) {
    return { xform: c, key, ok: true };
  }

  if (c instanceof Replace) {
    return { xform: null, key, ok: false };
  }

  if (c instanceof Splice || c instanceof Move) {
    const path = c.mapPath([key]);
    if (path == null) {
      return { xform: null, key, ok: false };
    }
    return { xform: null, key: path[0], ok: true };
  }

  if (c instanceof PathChange) {
    if ((c.path || []).length == 0) {
      return transform(c.change, key);
    }

    const len = PathChange.commonPrefixLen([key], c.path);
    if (len == 0) {
      return { xform: null, key, ok: true };
    }

    const xform = PathChange.create(c.path.slice(1), c.change);
    return { xform, key, ok: true };
  }

  if (c instanceof Changes) {
    const result = [];
    for (let cx of c) {
      const { xform, key: k2, ok } = transform(cx, key);
      if (!ok) {
        return { xform, key, ok };
      }
      key = k2;
      if (xform) {
        result.push(xform);
      }
    }
    const xform = Changes.create(result);
    return { xform, key, ok: true };
  }

  throw new Error("unknown change type: " + c.constructor.name);
}

/** Text represents a string value */
class Text extends Value {
  constructor(text) {
    super();
    this.text = (text || "").toString();
  }

  slice(start, end) {
    return new Text(this.text.slice(start, end));
  }

  get length() {
    return this.text.length;
  }

  /**
   * splice splices a replacement string (or Text)
   *
   * @param {Number} offset - where the replacement starts
   * @param {Number} count - number of characters to remove
   * @param {Text|String} replacement - what to replace with
   *
   * @return {Text}
   */
  splice(offset, count, replacement) {
    if (!(replacement instanceof Text)) {
      replacement = new Text(replacement);
    }

    const before = this.slice(offset, offset + count);
    const change = new Splice(offset, before, replacement);
    const version = this.stream && this.stream.append(change);
    return this._nextf(change, version).version;
  }

  /**
   * move shifts the sub-sequence by the specified distance.
   * If distance is positive, the sub-sequence shifts over to the
   * right by as many characters as specified in distance. Negative
   * distance shifts left.
   *
   * @param {Number} offset - start of sub-sequence to shift
   * @param {Number} count - size of sub-sequence to shift
   * @param {Number} distance - distance to shift
   *
   * @return {Text}
   */
  move(offset, count, distance) {
    const change = new Move(offset, count, distance);
    const version = this.stream && this.stream.append(change);
    return this._nextf(change, version).version;
  }

  /** clone makes a copy but with stream set to null */
  clone() {
    return new Text(this.text);
  }

  /**
   * Apply any change immutably.
   * @param {Change} c -- any change; can be null.
   * @returns {Value}
   */
  apply(c) {
    if (!c) {
      return this.clone();
    }

    if (c instanceof Replace) {
      return c.after;
    }

    if (c instanceof Splice) {
      const left = this.text.slice(0, c.offset);
      const right = this.text.slice(c.offset + c.before.length);
      return new Text(left + c.after.text + right);
    }

    if (c instanceof Move) {
      let { offset: o, distance: d, count: cx } = c;
      if (d < 0) {
        [o, cx, d] = [o + d, -d, cx];
      }

      const s1 = this.text.slice(0, o);
      const s2 = this.text.slice(o, o + cx);
      const s3 = this.text.slice(o + cx, o + cx + d);
      const s4 = this.text.slice(o + cx + d);
      return new Text(s1 + s3 + s2 + s4);
    }

    return c.applyTo(this);
  }

  toJSON() {
    return this.text;
  }

  static typeName() {
    return "changes/types.S16";
  }

  static fromJSON(decoder, json) {
    return new Text(json);
  }
}

/** Transformer wraps a {@link Conn} object, transforming all incoming ops */
class Transformer {
  /**
   * @param {Conn} conn -- the connection to wrap.
   * @param {Object} [cache] -- an optional ops cache.
   * @param {Object} cache.untransformed -- a map of version => raw operation.
   * @param {Object} cache.transformed - a map of version => transformed op.
   * @param {Object} cache.merge - a map of version to array of merge ops.
   */
  constructor(conn, cache) {
    this._c = conn;
    this._cache = cache || { untransformed: {}, transformed: {}, merge: {} };
  }

  /** write passes through to the underlying {@link Conn} */
  write(ops) {
    return this._c.write(ops);
  }

  /** read is the work horse, fetching ops from {@link Conn} and transforming it as needed */
  async read(version, limit, duration) {
    const transformed = this._cache.transformed[version];
    let ops = [];
    if (transformed) {
      for (let count = 0; count < limit; count++) {
        const op = this._cache.transformed[version + count];
        if (!op) break;
        ops.push(op);
      }
      return ops;
    }

    const raw = this._cache.untransformed[version];
    if (!raw) {
      ops = await this._c.read(version, limit, duration);
    } else {
      for (let count = 0; count < limit; count++) {
        const op = this._cache.untransformed[version + count];
        if (!op) break;
        ops.push(op);
      }
    }

    const result = [];
    for (let op of ops || []) {
      this._cache.untransformed[op.version] = op;
      const { xform } = await this._transformAndCache(op);
      result.push(xform);
    }
    return result;
  }

  async _transformAndCache(op) {
    if (!this._cache.transformed[op.version]) {
      const { xform, merge } = await this._transform(op);
      this._cache.transformed[op.version] = xform;
      this._cache.merge[op.version] = merge;
    }

    const xform = this._cache.transformed[op.version];
    const merge = this._cache.merge[op.version].slice(0);
    return { xform, merge };
  }

  async _transform(op) {
    const gap = op.version - op.basis - 1;
    if (gap === 0) {
      // no interleaved op, so no special transformation needed.
      return { xform: op, merge: [] };
    }

    // fetch all ops since basis
    const ops = await this.read(op.basis + 1, gap);

    let xform = op;
    let merge = [];

    if (op.parentId) {
      // skip all those before the parent if current op has parent
      while (!Transformer._equal(ops[0].id, op.parentId)) {
        ops.shift();
      }
      const parent = ops[0];
      ops.shift();

      // The current op is meant to be applied on top of the parent op.
      // The parent op has a merge chain which corresponds to the set of
      // operation were accepted by the server before the parent operation
      // but which were not known to the parent op.
      //
      // The current op may have factored in a few but those in the
      // merge chain that were not factored would contribute to its own
      // merge chain.
      ({ xform, merge } = await this._getMergeChain(op, parent));
    }

    // The transformed op needs to be merged against all ops that were
    // accepted by the server between the parent and the current op.
    for (let opx of ops) {
      let { xform: x } = await this._transformAndCache(opx);
      [xform, x] = Transformer._merge(x, xform);
      merge.push(x);
    }

    return { xform, merge };
  }

  // getMergeChain gets all operations in the merge chain of the parent
  // that hove not been factored into the current op.  The provided op
  // is transformed against this merge chain to form its own initial merge
  // chain.
  async _getMergeChain(op, parent) {
    const { merge } = await this._transformAndCache(parent);
    while (merge.length > 0 && merge[0].version <= op.basis) {
      merge.shift();
    }

    let xform = op;
    for (let kk = 0; kk < merge.length; kk++) {
      [xform, merge[kk]] = Transformer._merge(merge[kk], xform);
    }

    return { xform, merge };
  }

  static _merge(op1, op2) {
    let [c1, c2] = [op2.changes, op1.changes];
    if (op1.changes) {
      [c1, c2] = op1.changes.merge(op2.changes);
    }

    const op1x = new Operation(
      op2.id,
      op2.parentId,
      op2.version,
      op2.basis,
      c1
    );
    const op2x = new Operation(
      op1.id,
      op1.parentId,
      op1.version,
      op1.basis,
      c2
    );
    return [op1x, op2x];
  }

  static _equal(id1, id2) {
    // IDs can be any type, so to be safe JSON stringify it.
    return JSON.stringify(id1) == JSON.stringify(id2);
  }
}

module.exports = {
  Store,
  Dict,
  Text,
  Null,
  Ref,
  Field,
  run,
  field,
  Conn,
  Transformer
};
