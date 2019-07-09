## Classes

<dl>
<dt><a href="#Bool">Bool</a></dt>
<dd><p>Bool represents true/false</p>
</dd>
<dt><a href="#Changes">Changes</a></dt>
<dd><p>Implements a collection of change values</p>
</dd>
<dt><a href="#Conn">Conn</a></dt>
<dd><p>Conn creates a network connection or use with Session. See <a href="#Transformer">Transformer</a>.</p>
</dd>
<dt><a href="#Dict">Dict</a></dt>
<dd><p>Dict represents a map/hash/dictionary/collection with string keys</p>
</dd>
<dt><a href="#Field">Field</a></dt>
<dd><p>Field is a calculation that when invoked returns obj.field</p>
</dd>
<dt><a href="#GroupStream">GroupStream</a></dt>
<dd><p>GroupStream implements a groupd dict-of-dict-like stream</p>
</dd>
<dt><a href="#MapStream">MapStream</a></dt>
<dd><p>MapStream implement a mapped dictionary-like stream</p>
</dd>
<dt><a href="#Move">Move</a></dt>
<dd><p>Move represents shifting a sub-sequence over to a different spot.
It can be used with strings or array-like values.</p>
</dd>
<dt><a href="#Null">Null</a></dt>
<dd><p>Null represents an empty value</p>
</dd>
<dt><a href="#Num">Num</a></dt>
<dd><p>Num represents a generic numeric type</p>
</dd>
<dt><a href="#Operation">Operation</a></dt>
<dd><p>Operation is the change and metadata needed for network transmission</p>
</dd>
<dt><a href="#PathChange">PathChange</a></dt>
<dd><p>PathChange represents an embedded value changing at the specified path.</p>
</dd>
<dt><a href="#Ref">Ref</a></dt>
<dd><p>Ref represents a reference to a path</p>
</dd>
<dt><a href="#Replace">Replace</a></dt>
<dd><p>Replace represents a change one value to another</p>
</dd>
<dt><a href="#Seq">Seq</a></dt>
<dd><p>Seq represents a sequence of values</p>
</dd>
<dt><a href="#Session">Session</a></dt>
<dd><p>Session implements helpers for creating a session</p>
</dd>
<dt><a href="#Splice">Splice</a></dt>
<dd><p>Splice represents the change to replace a sub-sequence with another.
It can be used with strings or array-like values.</p>
</dd>
<dt><a href="#Store">Store</a></dt>
<dd><p>Store is a dictionary where the
default value type is also a dictionary</p>
</dd>
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
<dt><a href="#DerivedStream">DerivedStream</a></dt>
<dd><p>DerivedStream is a base class for all derived streams</p>
</dd>
<dt><a href="#Text">Text</a></dt>
<dd><p>Text represents a string value</p>
</dd>
<dt><a href="#Transformer">Transformer</a></dt>
<dd><p>Transformer wraps a <a href="#Conn">Conn</a> object, transforming all incoming ops</p>
</dd>
<dt><a href="#Value">Value</a></dt>
<dd><p>Value is the base class for values.</p>
<p>It should not be used directly but by subclassing.
Subclasses should implement clone(), toJSON(), static typeName() as
well as static fromJSON and optionally override apply().</p>
</dd>
<dt><a href="#View">View</a></dt>
<dd><p>View stores a calculation that invokes a stored fn and args</p>
</dd>
</dl>

## Constants

<dl>
<dt><a href="#MapIterator">MapIterator</a></dt>
<dd><p>MapIterator is implemented by map-like values and yield key-value pairs</p>
</dd>
<dt><a href="#SeqIterator">SeqIterator</a></dt>
<dd><p>SeqIterator is implemented by seq-like values and yield just values</p>
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
<dt><a href="#extend">extend()</a></dt>
<dd><p>extend creates an object which has all the keys of both args</p>
</dd>
<dt><a href="#filter">filter()</a></dt>
<dd><p>filter calls the provided fn on all keys of the object and only retains keys for which the fn evalutes to true</p>
</dd>
<dt><a href="#group">group()</a></dt>
<dd><p>group calls the provided fn on all keys of the object and
aggregates all items with same value of fn. It returns a
dictionary where the keys are groups and the values are
dictionaries with that group value</p>
</dd>
<dt><a href="#isMapLike">isMapLike()</a></dt>
<dd><p>isMapLike returns if object implements the MapIterator</p>
</dd>
<dt><a href="#map">map()</a></dt>
<dd><p>map calls the provided fn on all keys of the object</p>
</dd>
<dt><a href="#toDict">toDict()</a></dt>
<dd><p>toDict takes a map where the values are streams and converts it to
a live dict</p>
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
<dt><a href="#invoke">invoke()</a></dt>
<dd><p>invoke invokes a function reactively</p>
</dd>
</dl>

<a name="Bool"></a>

## Bool
Bool represents true/false

**Kind**: global class  
<a name="Bool+clone"></a>

### bool.clone()
clone makes a copy but with stream set to null

**Kind**: instance method of [<code>Bool</code>](#Bool)  
<a name="Changes"></a>

## Changes
Implements a collection of change values

**Kind**: global class  

* [Changes](#Changes)
    * [new exports.Changes(...changes)](#new_Changes_new)
    * [.revert()](#Changes+revert) ⇒ [<code>Changes</code>](#Changes)
    * [.merge()](#Changes+merge) ⇒ <code>Array.&lt;Change&gt;</code>

<a name="new_Changes_new"></a>

### new exports.Changes(...changes)

| Param | Type | Description |
| --- | --- | --- |
| ...changes | <code>Change</code> \| <code>Array.&lt;Change&gt;</code> | sequentially combine changes |

<a name="Changes+revert"></a>

### changes.revert() ⇒ [<code>Changes</code>](#Changes)
**Kind**: instance method of [<code>Changes</code>](#Changes)  
**Returns**: [<code>Changes</code>](#Changes) - - the inverse of the collection  
<a name="Changes+merge"></a>

### changes.merge() ⇒ <code>Array.&lt;Change&gt;</code>
Merge another change and return modified version of
the other and current change.

current + returned[0] and other + returned[1] are guaranteed
to result in the same state.

**Kind**: instance method of [<code>Changes</code>](#Changes)  
<a name="Conn"></a>

## Conn
Conn creates a network connection or use with Session. See [Transformer](#Transformer).

**Kind**: global class  

* [Conn](#Conn)
    * [new exports.Conn(url, fetch)](#new_Conn_new)
    * [.withPollMilliseconds()](#Conn+withPollMilliseconds)
    * [.write([Operation[]])](#Conn+write) ⇒ <code>Promise</code>
    * [.read([int], [limit], [duration])](#Conn+read) ⇒ <code>Promise</code>

<a name="new_Conn_new"></a>

### new exports.Conn(url, fetch)

| Param | Type | Description |
| --- | --- | --- |
| url | <code>string</code> | url to post requests to |
| fetch | <code>function</code> | window.fetch implementation or polyfill |

<a name="Conn+withPollMilliseconds"></a>

### conn.withPollMilliseconds()
withPollMilliseconds specifies poll interval to pass on to server

**Kind**: instance method of [<code>Conn</code>](#Conn)  
<a name="Conn+write"></a>

### conn.write([Operation[]]) ⇒ <code>Promise</code>
write ops using fetch

**Kind**: instance method of [<code>Conn</code>](#Conn)  

| Param | Description |
| --- | --- |
| [Operation[]] | ops - ops to write |

<a name="Conn+read"></a>

### conn.read([int], [limit], [duration]) ⇒ <code>Promise</code>
read ops using fetch

**Kind**: instance method of [<code>Conn</code>](#Conn)  

| Param | Description |
| --- | --- |
| [int] | version - version of op to start fetching from |
| [limit] | limit - max number of ops to fetch |
| [duration] | duration - max long poll interval to pass to server |

<a name="Dict"></a>

## Dict
Dict represents a map/hash/dictionary/collection with string keys

**Kind**: global class  

* [Dict](#Dict)
    * [.get()](#Dict+get)
    * [.keyExists()](#Dict+keyExists)
    * [.clone()](#Dict+clone)

<a name="Dict+get"></a>

### dict.get()
get looks up a key and returns the value (or a default value)

**Kind**: instance method of [<code>Dict</code>](#Dict)  
<a name="Dict+keyExists"></a>

### dict.keyExists()
check if key exists

**Kind**: instance method of [<code>Dict</code>](#Dict)  
<a name="Dict+clone"></a>

### dict.clone()
clone makes a copy but with stream set to null

**Kind**: instance method of [<code>Dict</code>](#Dict)  
<a name="Field"></a>

## Field
Field is a calculation that when invoked returns obj.field

**Kind**: global class  
<a name="GroupStream"></a>

## GroupStream
GroupStream implements a groupd dict-of-dict-like stream

**Kind**: global class  
<a name="MapStream"></a>

## MapStream
MapStream implement a mapped dictionary-like stream

**Kind**: global class  
<a name="Move"></a>

## Move
Move represents shifting a sub-sequence over to a different spot.
It can be used with strings or array-like values.

**Kind**: global class  

* [Move](#Move)
    * [new exports.Move(offset, count, distance)](#new_Move_new)
    * [.revert()](#Move+revert) ⇒ [<code>Move</code>](#Move)
    * [.merge()](#Move+merge) ⇒ <code>Array.&lt;Change&gt;</code>

<a name="new_Move_new"></a>

### new exports.Move(offset, count, distance)
Example: new Move(1, 2, -1) represents removing the slice
value.slice(1, 3) and re-inserting it at index 0.


| Param | Type | Description |
| --- | --- | --- |
| offset | <code>Number</code> | index of first element to shift. |
| count | <code>Number</code> | number of elements to shift. |
| distance | <code>Number</code> | how many elements to skip over. |

<a name="Move+revert"></a>

### move.revert() ⇒ [<code>Move</code>](#Move)
**Kind**: instance method of [<code>Move</code>](#Move)  
**Returns**: [<code>Move</code>](#Move) - - the inverse of the move  
<a name="Move+merge"></a>

### move.merge() ⇒ <code>Array.&lt;Change&gt;</code>
Merge another change and return modified version of
the other and current change.

current + returned[0] and other + returned[1] are guaranteed
to result in the same state.

**Kind**: instance method of [<code>Move</code>](#Move)  
<a name="Null"></a>

## Null
Null represents an empty value

**Kind**: global class  
<a name="Null+clone"></a>

### null.clone()
clone makes a copy but with stream set to null

**Kind**: instance method of [<code>Null</code>](#Null)  
<a name="Num"></a>

## Num
Num represents a generic numeric type

**Kind**: global class  
<a name="Num+clone"></a>

### num.clone()
clone makes a copy but with stream set to null

**Kind**: instance method of [<code>Num</code>](#Num)  
<a name="Operation"></a>

## Operation
Operation is the change and metadata needed for network transmission

**Kind**: global class  
<a name="new_Operation_new"></a>

### new exports.Operation([id], [parentId], [version], basis, changes)

| Param | Type | Description |
| --- | --- | --- |
| [id] | <code>string</code> | the id is typically auto-generated. |
| [parentId] | <code>string</code> | the id of the previous unacknowledged local op. |
| [version] | <code>int</code> | the zero-based index is updated by the server. |
| basis | <code>int</code> | - the version of the last applied acknowledged op. |
| changes | <code>Change</code> | - the actual change being sent to the server. |

<a name="PathChange"></a>

## PathChange
PathChange represents an embedded value changing at the specified path.

**Kind**: global class  

* [PathChange](#PathChange)
    * [new exports.PathChange(path, change)](#new_PathChange_new)
    * [.revert()](#PathChange+revert) ⇒ <code>Change</code>
    * [.merge()](#PathChange+merge) ⇒ <code>Array.&lt;Change&gt;</code>

<a name="new_PathChange_new"></a>

### new exports.PathChange(path, change)
The path is a sequence of index or key name to refer to the embeded value.

Example: root.rows[3] will have path ["rows", 3].


| Param | Type | Description |
| --- | --- | --- |
| path | <code>Array.&lt;Any&gt;</code> | path to inner value. |
| change | <code>Change</code> | any change applied to inner value at path. |

<a name="PathChange+revert"></a>

### pathChange.revert() ⇒ <code>Change</code>
**Kind**: instance method of [<code>PathChange</code>](#PathChange)  
**Returns**: <code>Change</code> - - the inverse of this change  
<a name="PathChange+merge"></a>

### pathChange.merge() ⇒ <code>Array.&lt;Change&gt;</code>
Merge another change and return modified version of
the other and current change.

current + returned[0] and other + returned[1] are guaranteed
to result in the same state.

**Kind**: instance method of [<code>PathChange</code>](#PathChange)  
<a name="Ref"></a>

## Ref
Ref represents a reference to a path

**Kind**: global class  

* [Ref](#Ref)
    * [.clone()](#Ref+clone)
    * [.run()](#Ref+run)

<a name="Ref+clone"></a>

### ref.clone()
clone makes a copy but with stream set to null

**Kind**: instance method of [<code>Ref</code>](#Ref)  
<a name="Ref+run"></a>

### ref.run()
run returns the underlying value at the path

**Kind**: instance method of [<code>Ref</code>](#Ref)  
<a name="Replace"></a>

## Replace
Replace represents a change one value to another

**Kind**: global class  

* [Replace](#Replace)
    * [new exports.Replace(before, after)](#new_Replace_new)
    * [.revert()](#Replace+revert) ⇒ [<code>Replace</code>](#Replace)
    * [.merge()](#Replace+merge) ⇒ <code>Array.&lt;Change&gt;</code>

<a name="new_Replace_new"></a>

### new exports.Replace(before, after)
before and after must be valid Value types (that implement apply()).


| Param | Type | Description |
| --- | --- | --- |
| before | [<code>Value</code>](#Value) | the value as it was before. |
| after | [<code>Value</code>](#Value) | the value as it is after. |

<a name="Replace+revert"></a>

### replace.revert() ⇒ [<code>Replace</code>](#Replace)
**Kind**: instance method of [<code>Replace</code>](#Replace)  
**Returns**: [<code>Replace</code>](#Replace) - - the inverse of the replace  
<a name="Replace+merge"></a>

### replace.merge() ⇒ <code>Array.&lt;Change&gt;</code>
Merge another change and return modified version of
the other and current change.

current + returned[0] and other + returned[1] are guaranteed
to result in the same state.

**Kind**: instance method of [<code>Replace</code>](#Replace)  
<a name="Seq"></a>

## Seq
Seq represents a sequence of values

**Kind**: global class  

* [Seq](#Seq)
    * [.splice(offset, count, replacement)](#Seq+splice) ⇒ [<code>Text</code>](#Text)
    * [.move(offset, count, distance)](#Seq+move) ⇒ [<code>Text</code>](#Text)
    * [.clone()](#Seq+clone)

<a name="Seq+splice"></a>

### seq.splice(offset, count, replacement) ⇒ [<code>Text</code>](#Text)
splice splices a replacement sequence

**Kind**: instance method of [<code>Seq</code>](#Seq)  

| Param | Type | Description |
| --- | --- | --- |
| offset | <code>Number</code> | where the replacement starts |
| count | <code>Number</code> | number of items to remove |
| replacement | [<code>Text</code>](#Text) \| <code>String</code> | what to replace with |

<a name="Seq+move"></a>

### seq.move(offset, count, distance) ⇒ [<code>Text</code>](#Text)
move shifts the sub-sequence by the specified distance.
If distance is positive, the sub-sequence shifts over to the
right by as many characters as specified in distance. Negative
distance shifts left.

**Kind**: instance method of [<code>Seq</code>](#Seq)  

| Param | Type | Description |
| --- | --- | --- |
| offset | <code>Number</code> | start of sub-sequence to shift |
| count | <code>Number</code> | size of sub-sequence to shift |
| distance | <code>Number</code> | distance to shift |

<a name="Seq+clone"></a>

### seq.clone()
clone makes a copy but with stream set to null

**Kind**: instance method of [<code>Seq</code>](#Seq)  
<a name="Session"></a>

## Session
Session implements helpers for creating a session

**Kind**: global class  

* [Session](#Session)
    * [.undoable()](#Session.undoable)
    * [.serialize()](#Session.serialize)
    * [.connect()](#Session.connect)

<a name="Session.undoable"></a>

### Session.undoable()
undoable wraps the object with a undo stack

**Kind**: static method of [<code>Session</code>](#Session)  
<a name="Session.serialize"></a>

### Session.serialize()
Serialize serializes a connected value for later
use with connect

**Kind**: static method of [<code>Session</code>](#Session)  
<a name="Session.connect"></a>

### Session.connect()
connect creates a root object that can sync against
the provided URL. If serialized is not provided, a Null
initial object is created.

**Kind**: static method of [<code>Session</code>](#Session)  
<a name="Splice"></a>

## Splice
Splice represents the change to replace a sub-sequence with another.
It can be used with strings or array-like values.

**Kind**: global class  
<a name="new_Splice_new"></a>

### new exports.Splice(offset, before, value)

| Param | Type | Description |
| --- | --- | --- |
| offset | <code>Number</code> | - where the sub-sequence starts. |
| before | [<code>Value</code>](#Value) | - the subsequnce as it was before. |
| value | [<code>Value</code>](#Value) | the subsequence as it is after. |

<a name="Store"></a>

## Store
Store is a dictionary where the
default value type is also a dictionary

**Kind**: global class  
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
<a name="DerivedStream"></a>

## DerivedStream
DerivedStream is a base class for all derived streams

**Kind**: global class  
<a name="Text"></a>

## Text
Text represents a string value

**Kind**: global class  

* [Text](#Text)
    * [.splice(offset, count, replacement)](#Text+splice) ⇒ [<code>Text</code>](#Text)
    * [.move(offset, count, distance)](#Text+move) ⇒ [<code>Text</code>](#Text)
    * [.clone()](#Text+clone)
    * [.apply(c)](#Text+apply) ⇒ [<code>Value</code>](#Value)

<a name="Text+splice"></a>

### text.splice(offset, count, replacement) ⇒ [<code>Text</code>](#Text)
splice splices a replacement string (or Text)

**Kind**: instance method of [<code>Text</code>](#Text)  

| Param | Type | Description |
| --- | --- | --- |
| offset | <code>Number</code> | where the replacement starts |
| count | <code>Number</code> | number of characters to remove |
| replacement | [<code>Text</code>](#Text) \| <code>String</code> | what to replace with |

<a name="Text+move"></a>

### text.move(offset, count, distance) ⇒ [<code>Text</code>](#Text)
move shifts the sub-sequence by the specified distance.
If distance is positive, the sub-sequence shifts over to the
right by as many characters as specified in distance. Negative
distance shifts left.

**Kind**: instance method of [<code>Text</code>](#Text)  

| Param | Type | Description |
| --- | --- | --- |
| offset | <code>Number</code> | start of sub-sequence to shift |
| count | <code>Number</code> | size of sub-sequence to shift |
| distance | <code>Number</code> | distance to shift |

<a name="Text+clone"></a>

### text.clone()
clone makes a copy but with stream set to null

**Kind**: instance method of [<code>Text</code>](#Text)  
<a name="Text+apply"></a>

### text.apply(c) ⇒ [<code>Value</code>](#Value)
Apply any change immutably.

**Kind**: instance method of [<code>Text</code>](#Text)  

| Param | Type | Description |
| --- | --- | --- |
| c | <code>Change</code> | - any change; can be null. |

<a name="Transformer"></a>

## Transformer
Transformer wraps a [Conn](#Conn) object, transforming all incoming ops

**Kind**: global class  

* [Transformer](#Transformer)
    * [new exports.Transformer(conn, [cache])](#new_Transformer_new)
    * [.write()](#Transformer+write)
    * [.read()](#Transformer+read)

<a name="new_Transformer_new"></a>

### new exports.Transformer(conn, [cache])

| Param | Type | Description |
| --- | --- | --- |
| conn | [<code>Conn</code>](#Conn) | - the connection to wrap. |
| [cache] | <code>Object</code> | - an optional ops cache. |
| cache.untransformed | <code>Object</code> | - a map of version => raw operation. |
| cache.transformed | <code>Object</code> | a map of version => transformed op. |
| cache.merge | <code>Object</code> | a map of version to array of merge ops. |

<a name="Transformer+write"></a>

### transformer.write()
write passes through to the underlying [Conn](#Conn)

**Kind**: instance method of [<code>Transformer</code>](#Transformer)  
<a name="Transformer+read"></a>

### transformer.read()
read is the work horse, fetching ops from [Conn](#Conn) and transforming it as needed

**Kind**: instance method of [<code>Transformer</code>](#Transformer)  
<a name="Value"></a>

## Value
Value is the base class for values.

It should not be used directly but by subclassing.
Subclasses should implement clone(), toJSON(), static typeName() as
well as static fromJSON and optionally override apply().

**Kind**: global class  

* [Value](#Value)
    * [.next](#Value+next) : <code>Object</code>
    * [.setStream()](#Value+setStream)
    * [.replace()](#Value+replace) ⇒ [<code>Value</code>](#Value)
    * [.latest()](#Value+latest)
    * [.apply()](#Value+apply)
    * [.branch()](#Value+branch)
    * [.push()](#Value+push)
    * [.pull()](#Value+pull)
    * [.undo()](#Value+undo)
    * [.redo()](#Value+redo)

<a name="Value+next"></a>

### value.next : <code>Object</code>
null or {change, version}

**Kind**: instance property of [<code>Value</code>](#Value)  
<a name="Value+setStream"></a>

### value.setStream()
setStream mutates the current value and updates it stream

**Kind**: instance method of [<code>Value</code>](#Value)  
<a name="Value+replace"></a>

### value.replace() ⇒ [<code>Value</code>](#Value)
replace substitutes this with another value

**Kind**: instance method of [<code>Value</code>](#Value)  
**Returns**: [<code>Value</code>](#Value) - r - r has same stream as this  
<a name="Value+latest"></a>

### value.latest()
latest returns the latest version

**Kind**: instance method of [<code>Value</code>](#Value)  
<a name="Value+apply"></a>

### value.apply()
default apply only supports Replace

**Kind**: instance method of [<code>Value</code>](#Value)  
<a name="Value+branch"></a>

### value.branch()
branch returns a value that is on its own branch with push/pull support

**Kind**: instance method of [<code>Value</code>](#Value)  
<a name="Value+push"></a>

### value.push()
push pushes the changes up to the parent

**Kind**: instance method of [<code>Value</code>](#Value)  
<a name="Value+pull"></a>

### value.pull()
pull pulls changes from the parent

**Kind**: instance method of [<code>Value</code>](#Value)  
<a name="Value+undo"></a>

### value.undo()
undoes the last change on this branch

**Kind**: instance method of [<code>Value</code>](#Value)  
<a name="Value+redo"></a>

### value.redo()
redoes the last undo on this branch

**Kind**: instance method of [<code>Value</code>](#Value)  
<a name="View"></a>

## View
View stores a calculation that invokes a stored fn and args

**Kind**: global class  
<a name="View+clone"></a>

### view.clone()
clone returns a copy with the stream set to null

**Kind**: instance method of [<code>View</code>](#View)  
<a name="MapIterator"></a>

## MapIterator
MapIterator is implemented by map-like values and yield key-value pairs

**Kind**: global constant  
<a name="SeqIterator"></a>

## SeqIterator
SeqIterator is implemented by seq-like values and yield just values

**Kind**: global constant  
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

<a name="extend"></a>

## extend()
extend creates an object which has all the keys of both args

**Kind**: global function  
<a name="filter"></a>

## filter()
filter calls the provided fn on all keys of the object and only retains keys for which the fn evalutes to true

**Kind**: global function  
<a name="group"></a>

## group()
group calls the provided fn on all keys of the object and
aggregates all items with same value of fn. It returns a
dictionary where the keys are groups and the values are
dictionaries with that group value

**Kind**: global function  
<a name="isMapLike"></a>

## isMapLike()
isMapLike returns if object implements the MapIterator

**Kind**: global function  
<a name="map"></a>

## map()
map calls the provided fn on all keys of the object

**Kind**: global function  
<a name="toDict"></a>

## toDict()
toDict takes a map where the values are streams and converts it to
a live dict

**Kind**: global function  
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

<a name="invoke"></a>

## invoke()
invoke invokes a function reactively

**Kind**: global function  
