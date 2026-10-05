# Callbacks and copying

## Import and signature

```js
import walk from '@peter.naydenov/walk'
// CommonJS: const walk = require ( '@peter.naydenov/walk' )

let result = walk ({ data, keyCallback, objectCallback, settings }, ...args)
```

Only `data` is required. Extra positional arguments are forwarded to both
callbacks after their arguments object, in the same order.

| Callback | Receives | Additional fields |
| --- | --- | --- |
| `keyCallback` | Leaves: primitives, functions, and supported built-in values | `isFinished` |
| `objectCallback` | Object and array containers, including the root | `PASS` |

Both receive `value`, string `key`, `IGNORE`, and `FINISH`. `breadcrumbs`
and read-only `parentPath` are present unless disabled. The root object
callback's key is `'root'`. Helpers are supplied to callbacks, not imported
as named exports. `isFinished` is normally `false` in key callbacks.

## Return values

When copying, return the value to keep. Returning `null` or `undefined`
stores it. Return `IGNORE()` to remove the current property or branch.

- A plain object or array returned by either callback is traversed and
  copied. Its children receive callbacks. A container returned by
  `keyCallback` does not itself receive another `objectCallback` call.
- A simple replacement returned by `objectCallback` goes to `keyCallback`
  when key callbacks are active for its parent. A `PASS` instruction skips
  that call. Simple root replacements are returned directly.
- Built-in replacements remain leaves and are stored by reference.
- In no-copy mode, returns still control traversal but are never assigned
  to the source. Leaf callbacks used for side effects may omit their return.
  Object callbacks must return a container to continue into it.
- A primitive or built-in root is returned directly without callbacks;
  with `copy:false`, the return is always `undefined`.
- Root `IGNORE()` produces an empty object or array matching the input
  root when copying, or `undefined` without copying.

`IGNORE`, `PASS`, and `FINISH` must be called and their results returned.
Returning the function itself is an ordinary function value. Version 6's
`return IGNORE` must therefore become `return IGNORE()` in version 7.

## What is copied

Walk copies own enumerable string-keyed properties into new editable object
and array containers. It does not preserve prototypes, property descriptors,
non-enumerable properties, or symbol-keyed properties. Enumerable getters
are read once per visited property.

`Date`, `RegExp`, `Map`, `Set`, `WeakMap`, `WeakSet`, `ArrayBuffer`,
`DataView`, typed arrays, DOM nodes, and functions remain the same references.
Their internal contents are not visited. Use an appropriate independent
clone operation when the task requires cloning those built-in contents.

Callbacks receive source or replacement values. Mutating them may mutate
the original data; return a replacement instead when preservation matters.
Walk does not freeze the result.

Array traversal uses input index strings. Removed items and sparse holes
are compacted in the result; non-index enumerable properties keep their
names. Own `__proto__` keys are copied as data properties.

## Visit order

Within a container, properties follow `Object.keys` order. Object callbacks
run before the corresponding container's contents. Contents are queued and
processed later in scheduling order; this is not recursive depth-first order.

For `{ first:{ a:1 }, second:{ b:2 } }`, ordinary callback order is:

```text
object root
object first
object second
key a
key b
```

Do not treat the next object callback as a signal that the previous
container's keys are complete. Callback values are input or replacement
values, not completed transformed subtrees. Walk has no post-order callback.

Promises returned by synchronous callbacks are not awaited. For asynchronous
work, use `@peter.naydenov/walk-async`, which returns a Promise.
