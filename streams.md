## Classes

<dl>
<dt><a href="#Stream">Stream</a></dt>
<dd><p>Stream tracks all future changes to a particular value.</p>
<p>Use the next property to check if there is a subsequent change.</p>
<p>The next property is null if there is no further change yet. It is
an object <code>{change, version}</code> where change refers to the actual
change and version refers to the next stream instance (with its own
next field if there are further changes).</p>
<p>The whole stream is effectively immutable with the next field only
ever getting written to once when a new version happens. If more
changes are made on the current stream, those versions are tacked
on at the end of the next version (with the changes appropriately
factoring all other changes),</p>
<p>Streams are convergent: chasing the next pointer of any stream
instance in a particular stream will converge (i.e applying the
changes will end up with same value even if the changes themselves
are a little different).</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#branch">branch(s)</a> ⇒ <code><a href="#Stream">Stream</a></code></dt>
<dd><p>branch creates a branched stream.  Updates to the returned branched
stream or the parent stream are not automatically carried over to
each other.  Instead, returned branch stream implements push() and
pull() to do this on demand.</p>
</dd>
<dt><a href="#undoable">undoable(s)</a> ⇒ <code><a href="#Stream">Stream</a></code></dt>
<dd><p>undoable creates an undo stream.</p>
<p>All changes to the parent stream are tracked and calls to 
undo() and redo() on the returned stream correspondingly 
behaving like global undo/redo: i.e. they revert or reapply
the corresponding changes and behave like an undo stack in
an editor.</p>
<p>This is resilient to interleaving upstream changes, appropriately 
transforming the local change to preserve the intent of the
change.</p>
</dd>
</dl>

<a name="Stream"></a>

## Stream
Stream tracks all future changes to a particular value.

Use the next property to check if there is a subsequent change.

The next property is null if there is no further change yet. It is
an object `{change, version}` where change refers to the actual
change and version refers to the next stream instance (with its own
next field if there are further changes).

The whole stream is effectively immutable with the next field only
ever getting written to once when a new version happens. If more
changes are made on the current stream, those versions are tacked
on at the end of the next version (with the changes appropriately
factoring all other changes),

Streams are convergent: chasing the next pointer of any stream
instance in a particular stream will converge (i.e applying the
changes will end up with same value even if the changes themselves
are a little different).

**Kind**: global class  
<a name="branch"></a>

## branch(s) ⇒ [<code>Stream</code>](#Stream)
branch creates a branched stream.  Updates to the returned branched
stream or the parent stream are not automatically carried over to
each other.  Instead, returned branch stream implements push() and
pull() to do this on demand.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| s | [<code>Stream</code>](#Stream) | parent stream |

<a name="undoable"></a>

## undoable(s) ⇒ [<code>Stream</code>](#Stream)
undoable creates an undo stream.

All changes to the parent stream are tracked and calls to 
undo() and redo() on the returned stream correspondingly 
behaving like global undo/redo: i.e. they revert or reapply
the corresponding changes and behave like an undo stack in
an editor.

This is resilient to interleaving upstream changes, appropriately 
transforming the local change to preserve the intent of the
change.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| s | [<code>Stream</code>](#Stream) | parent stream |

