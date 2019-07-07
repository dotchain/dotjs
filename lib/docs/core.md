## Classes

<dl>
<dt><a href="#Atomic">Atomic</a></dt>
<dd><p>Implements DOTJS value semantics for atomic values.</p>
<p>An atomic value can only be replaced as a whole.</p>
</dd>
<dt><a href="#Changes">Changes</a></dt>
<dd><p>Implements a collection of change values</p>
</dd>
<dt><a href="#Move">Move</a></dt>
<dd><p>Move represents shifting a sub-sequence over to a different spot.
It can be used with strings or array-like values.</p>
</dd>
<dt><a href="#Null">Null</a></dt>
<dd><p>Null represents an empty value</p>
</dd>
<dt><a href="#PathChange">PathChange</a></dt>
<dd><p>PathChange represents an embedded value changing at the specified path.</p>
</dd>
<dt><a href="#Replace">Replace</a></dt>
<dd><p>Replace represents a change one value to another</p>
</dd>
<dt><a href="#Splice">Splice</a></dt>
<dd><p>Splice represents the change to replace a sub-sequence with another.
It can be used with strings or array-like values.</p>
</dd>
<dt><a href="#Text">Text</a></dt>
<dd><p>Text represents a string value that supports Splice/Move etc.</p>
</dd>
</dl>

<a name="Atomic"></a>

## Atomic
Implements DOTJS value semantics for atomic values.

An atomic value can only be replaced as a whole.

**Kind**: global class  

* [Atomic](#Atomic)
    * [new exports.Atomic(value)](#new_Atomic_new)
    * [.apply(c)](#Atomic+apply) ⇒ <code>Value</code>

<a name="new_Atomic_new"></a>

### new exports.Atomic(value)

| Param | Type | Description |
| --- | --- | --- |
| value | <code>Any</code> | the value being wrapped. |

<a name="Atomic+apply"></a>

### atomic.apply(c) ⇒ <code>Value</code>
Apply any change immutably.

**Kind**: instance method of [<code>Atomic</code>](#Atomic)  

| Param | Type | Description |
| --- | --- | --- |
| c | <code>Change</code> | - any change; can be null. |

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
<a name="Null+apply"></a>

### null.apply(c) ⇒ <code>Value</code>
Apply any change immutably.

**Kind**: instance method of [<code>Null</code>](#Null)  

| Param | Type | Description |
| --- | --- | --- |
| c | <code>Change</code> | - any change; can be null. |

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
| before | <code>Value</code> | the value as it was before. |
| after | <code>Value</code> | the value as it is after. |

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
| before | <code>Value</code> | - the subsequnce as it was before. |
| value | <code>Value</code> | the subsequence as it is after. |

<a name="Text"></a>

## Text
Text represents a string value that supports Splice/Move etc.

**Kind**: global class  
<a name="Text+apply"></a>

### text.apply(c) ⇒ <code>Value</code>
Apply any change immutably.

**Kind**: instance method of [<code>Text</code>](#Text)  

| Param | Type | Description |
| --- | --- | --- |
| c | <code>Change</code> | - any change; can be null. |

