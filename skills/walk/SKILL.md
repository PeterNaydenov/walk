---
name: walk
description: >-
  Uses @peter.naydenov/walk to copy, transform, filter, or inspect nested
  JavaScript data with callbacks. Use for deep copies with transformations,
  masking or removing nested fields, pruning branches, deep forEach, and
  early-stop searches. Applies to the synchronous Walk API, not async
  callbacks or independent cloning of built-in objects such as Map and Date.
---

# Walk

Write traversal rules with `@peter.naydenov/walk`. Walk handles the nesting
and builds an editable copy by default. This skill covers the version 7 API.

## Choose the call

| Intent | Use |
| --- | --- |
| Copy nested objects and arrays | `walk ({ data })` |
| Transform, mask, or remove leaves | `keyCallback` |
| Replace a container or remove a branch | `objectCallback` |
| Inspect without building a copy | `settings:{ copy:false }` |
| Skip immediate key callbacks but visit nested containers | Return `PASS()` or `PASS(value)` from `objectCallback` |
| Stop at a match | Return `FINISH()` or `FINISH(value)` |

For example, mask passwords at any depth:

```js
import walk from '@peter.naydenov/walk'

let data = { user:{ password:'secret', name:'Peter' } };
let result = walk ({
                          data
                        , keyCallback : ({ key, value }) => key === 'password' ? '[hidden]' : value
                    })
// { user:{ password:'[hidden]', name:'Peter' } }
```

## Essential rules

- Return the intended value when copying. `null` and `undefined` are values,
  not instructions to remove a property.
- Call and return helper instructions: `return IGNORE()`, `return PASS()`,
  or `return FINISH()`. Calling without returning has no traversal effect.
- An object callback must return a value to continue into that container,
  including when `copy:false`. A leaf callback used only for side effects
  may omit its return in that mode. Walk then returns `undefined`.
- Return new containers to avoid mutating source data. Built-in objects and
  functions are leaves preserved by reference; this is not a full graph clone.
- Callbacks are synchronous. Use `@peter.naydenov/walk-async` for callbacks
  that must be awaited. Do not invent methods such as `walk.pick()`.

## Read the relevant reference

Read only the files needed for the request. Resolve these links relative to
this skill folder; they remain usable when the folder is installed elsewhere.

- [Callbacks and copying](references/callbacks.md): callback arguments,
  return values, root behaviour, built-in references, and queued visit order.
- [Traversal controls](references/control-flow.md): `IGNORE`, local `PASS`,
  both `FINISH` forms, `isFinished`, and partially completed results.
- [Paths, settings, and cycles](references/settings.md): `parentPath`,
  breadcrumbs, performance switches, circular links, and shared references.
- [Runnable examples](references/examples.md): input and output examples
  for filtering, pruning, local skipping, searching, and final branches.

## Deliver the solution

Provide focused code in the developer's existing style, using ESM by default.
Explain the selected callback or setting and any limitation relevant to the
task. Prefer one walk with combined rules when it satisfies the request;
finite nested walks are supported when needed. Explain speed through work
avoided, without claiming a universal advantage over other libraries.
