## Classes

<dl>
<dt><a href="#Conn">Conn</a></dt>
<dd><p>Conn creates a network connection or use with Session. See <a href="#Transformer">Transformer</a>.</p>
</dd>
<dt><a href="#Operation">Operation</a></dt>
<dd><p>Operation is the change and metadata needed for network transmission</p>
</dd>
<dt><a href="#Server">Server</a></dt>
<dd><p>Server wraps a <a href="#Conn">Conn</a> into an express middleware</p>
</dd>
<dt><a href="#Session">Session</a></dt>
<dd><p>Session syncs a local stream with an network connection</p>
</dd>
<dt><a href="#Transformer">Transformer</a></dt>
<dd><p>Transformer wraps a <a href="#Conn">Conn</a> object, transforming all incoming ops</p>
</dd>
</dl>

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

<a name="Server"></a>

## Server
Server wraps a [Conn](#Conn) into an express middleware

**Kind**: global class  

* [Server](#Server)
    * [new exports.Server(conn, bodyParser)](#new_Server_new)
    * [.handle()](#Server+handle)

<a name="new_Server_new"></a>

### new exports.Server(conn, bodyParser)

| Param | Type | Description |
| --- | --- | --- |
| conn | <code>Connn</code> \| [<code>Transformer</code>](#Transformer) | - the connection to use as destination. |
| bodyParser | <code>Object</code> | - use require("body-parser") |

<a name="Server+handle"></a>

### server.handle()
the expressjs entrypoint

**Kind**: instance method of [<code>Server</code>](#Server)  
<a name="Session"></a>

## Session
Session syncs a local stream with an network connection

**Kind**: global class  

* [Session](#Session)
    * [.withLog(log)](#Session+withLog) ⇒ [<code>Session</code>](#Session)
    * [.withNow(now)](#Session+withNow) ⇒ [<code>Session</code>](#Session)
    * [.withPending(pending, merge, version)](#Session+withPending) ⇒ [<code>Session</code>](#Session)
    * [.pull(conn)](#Session+pull) ⇒ <code>Promise</code>
    * [.push(conn)](#Session+push) ⇒ <code>Promise</code>

<a name="Session+withLog"></a>

### session.withLog(log) ⇒ [<code>Session</code>](#Session)
configure logger for reporting errors.

**Kind**: instance method of [<code>Session</code>](#Session)  

| Param | Type | Description |
| --- | --- | --- |
| log | <code>Object</code> | only log.error(...) is used. |

<a name="Session+withNow"></a>

### session.withNow(now) ⇒ [<code>Session</code>](#Session)
configure time function

**Kind**: instance method of [<code>Session</code>](#Session)  

| Param | Type | Description |
| --- | --- | --- |
| now | <code>function</code> | use () => (new Date).getTime() |

<a name="Session+withPending"></a>

### session.withPending(pending, merge, version) ⇒ [<code>Session</code>](#Session)
configure state for restarting a session

**Kind**: instance method of [<code>Session</code>](#Session)  

| Param | Type | Description |
| --- | --- | --- |
| pending | [<code>Array.&lt;Operation&gt;</code>](#Operation) | the last value of session.pending |
| merge | [<code>Array.&lt;Operation&gt;</code>](#Operation) | thee last value of session.merge |
| version | <code>int</code> | the last value of version |

<a name="Session+pull"></a>

### session.pull(conn) ⇒ <code>Promise</code>
pull fetches server side ops and applies them to the stream

if a call is in progress, returns the last promise.

**Kind**: instance method of [<code>Session</code>](#Session)  

| Param | Type | Description |
| --- | --- | --- |
| conn | [<code>Conn</code>](#Conn) \| [<code>Transformer</code>](#Transformer) | - the connection to use |

<a name="Session+push"></a>

### session.push(conn) ⇒ <code>Promise</code>
push takes all local changes and sends them upstream

if a call is in progress, returns the last promise.

**Kind**: instance method of [<code>Session</code>](#Session)  

| Param | Type | Description |
| --- | --- | --- |
| conn | [<code>Conn</code>](#Conn) \| [<code>Transformer</code>](#Transformer) | - the connection to use |

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
