# Walk (@peter.naydenov/walk)

![version](https://img.shields.io/github/package-json/v/peterNaydenov/walk)
![license](https://img.shields.io/github/license/peterNaydenov/walk)
![npm](https://img.shields.io/npm/dt/%40peter.naydenov/walk)
![GitHub issues](https://img.shields.io/github/issues/peterNaydenov/walk)
![GitHub top language](https://img.shields.io/github/languages/top/peterNaydenov/walk)
![npm package minimized gzipped size (select exports)](https://img.shields.io/bundlejs/size/%40peter.naydenov%2Fwalk)

**Write the rules. Let `walk` handle the nesting.**

Mask values, remove branches, and reshape objects while building a new result. Or inspect the data without creating a copy. `walk` travels through nested objects and arrays for you, so one or two callback functions can replace layers of loops and repeated transformations.

A deep copy is the starting point. What you do during the copy is where it gets interesting:

```js
import walk from '@peter.naydenov/walk'

let data = {
                  user    : { name:'Peter', email:'peter@example.test', password:'secret' }
                , history : [{ action:'login' }]
            };

let result = walk ({
                          data
                        , objectCallback : ({ value, key, IGNORE }) => key === 'history' ? IGNORE() : value
                        , keyCallback : ({ value, key, IGNORE }) => {
                                              if ( key === 'password' )   return IGNORE()
                                              if ( key === 'email' )      return 'hidden'
                                              return value
                                          }
                    })
// { user:{ name:'Peter', email:'hidden' } }
```

The rules work wherever those keys appear. The `history` branch is removed before its contents are visited. The source remains unchanged because these callbacks return replacements rather than modifying it.

> This README describes the upcoming major release. `IGNORE()` replaces the earlier `IGNORE` constant. See the [migration guide](Migration.guide.md) when upgrading.

## Choose synchronous or asynchronous Walk

Choose the library according to the work your callbacks do:

| Callback work | Choose |
| --- | --- |
| Immediate transformations, masking, filtering, or collecting values | [`@peter.naydenov/walk`](https://github.com/PeterNaydenov/walk) |
| Awaiting network requests, database queries, file reads, or other asynchronous operations | [`@peter.naydenov/walk-async`](https://github.com/PeterNaydenov/walk-async) |

The two libraries share traversal rules, settings, paths, `IGNORE()`, `PASS()` and `FINISH()`. Synchronous Walk returns the result directly and does not await callback promises. Walk Async awaits callback results and returns a Promise, so await the walk to obtain the result or finish a deep forEach. Walk Async processes callbacks in traversal order; sibling callbacks do not run concurrently.

### Immediate callbacks: measured comparison

An immediately completed callback still has an async cost. In this historical sample recorded on October 3, 2026, before FINISH was added to either implementation, synchronous Walk completed the workloads about **4–9 times faster** with default settings. Median times in milliseconds:

| Shape | Sync | Async: plain return | Async: async callback | Async: immediate resolve(value) |
| --- | --- | --- | --- | --- |
| 1,000,000-key flat object | 317.64 | 1359.22 | 1332.44 | 1497.33 |
| 100,000 records with nested metadata and tags | 136.58 | 1065.70 | 1194.75 | 1224.21 |
| 4,000-level child chain | 8.83 | 75.77 | 74.93 | 69.07 |

Both callbacks simply passed through `value`. The async variants returned it directly, used an `async` callback returning it, or called `resolve(value)` immediately. No callback waited for I/O or a timer. Copying, breadcrumbs, parent paths, and circular detection were enabled. Measurements used Node v26.10.0 on macOS arm64, one warmup per combination, and five samples with rotating execution order on the same machine.

The comparison also covered disabled paths and traversal without copying; synchronous Walk was faster in every tested combination. The exact difference depends on the data, settings, runtime, and callback work. The 4–9 times range describes these default-setting samples, rather than a guarantee for every application. Choose sync for work that completes synchronously, and async when callbacks need to await operations.

The [benchmark script](https://github.com/PeterNaydenov/walk-async/blob/main/benchmarks/compareSpeed.mjs) and [complete samples](https://github.com/PeterNaydenov/walk-async/blob/main/benchmarks/compareSpeed.results.json) are kept in the Walk Async repository. The saved samples do not contain source hashes; rerunning the script measures the current checked-out sources. To run the comparison, check out both repositories beside each other and run `node benchmarks/compareSpeed.mjs` from Walk Async.

## Installation

```sh
npm install @peter.naydenov/walk
```

Use an ES module import:

```js
import walk from '@peter.naydenov/walk'
```

Or CommonJS:

```js
const walk = require ( '@peter.naydenov/walk' )
```

## One walk, one or two callbacks

```js
let result = walk ({
                          data
                        , keyCallback
                        , objectCallback
                        , settings
                    }, ...args )
```

Only `data` is required. Choose the callbacks your task needs:

| Callback | Receives | Use it to |
| --- | --- | --- |
| `keyCallback` | Leaf values: primitives, functions, and supported built-in values | Change, mask, collect, or remove individual values |
| `objectCallback` | Objects and arrays, including the root | Reshape containers, remove branches, or skip their immediate key callbacks |

Both callbacks receive an arguments object. Extra arguments passed after the options are forwarded to both callbacks in the same order.

| Argument | Meaning |
| --- | --- |
| `value` | The current value |
| `key` | The property's name as a string; `'root'` for the root object callback |
| `breadcrumbs` | A string such as `'root/profile/age'` |
| `parentPath` | A read-only array such as `['root','profile']`, excluding the current key |
| `IGNORE` | Call and return `IGNORE()` to remove the key or branch |
| `PASS` | Available to `objectCallback`; return `PASS()` or `PASS(value)` to skip immediate key callbacks |
| `FINISH` | Return an instruction to finish the walk; `FINISH()` omits the current value, and `FINISH(value)` selects a final value |
| `isFinished` | Available to `keyCallback`; `true` in the final branch selected by `objectCallback`, otherwise `false` |

When copying, return the value you want in the result. Return `value` to keep it unchanged. Returning `null` or `undefined` stores that value; it does not remove the property. `IGNORE()` removes it and continues the walk; `FINISH()` omits it and stops the entire walk. With `settings.copy:false`, returns still control which structures get visited, but no result is built. The helper instructions must be returned; simply calling them has no effect on traversal.

## Agent skill

The [Walk skill](skills/walk/SKILL.md) helps coding agents use the version 7
API. It includes callback rules, traversal controls, settings, and runnable
examples, loaded as needed. The complete folder is available at `skills/walk/`
and can be used by different agents. See [skill integration and maintenance](skills/README.md).

## Transform while copying

Change a leaf in `keyCallback`, or return a replacement object from `objectCallback`. The returned structure becomes the input for the next part of the walk.

```js
let data = {
                  profile : { name:'Peter', active:true, internalCode:42 }
                , visits  : 3
            };

let result = walk ({
                          data
                        , objectCallback : ({ value, key }) => {
                                              if ( key === 'profile' )   return { name:value.name, active:value.active }
                                              return value
                                          }
                        , keyCallback : ({ value, key }) => key === 'name' ? value.toUpperCase() : value
                    })
// { profile:{ name:'PETER', active:true }, visits:3 }
```

A plain object or array returned by either callback is walked into and copied. When `keyCallback` returns a container, its children receive the normal callbacks; `objectCallback` is not called again for that replacement container itself.

A simple value returned by `objectCallback` is passed to `keyCallback` if key callbacks are active for its parent. A simple replacement returned from the root object callback is returned directly.

For an ordinary copy, leave out both callbacks:

```js
let data = { profile:{ name:'Peter' }, scores:[1,2,3] };
let result = walk ({ data })

result !== data                  // true
result.profile !== data.profile  // true
result.scores !== data.scores    // true
```

Objects and arrays get new containers. Supported built-in values and functions keep their original references; see [What gets copied](#what-gets-copied).

A leaf value passed as root `data` is returned directly when copying; neither callback runs for that root. With `settings.copy:false`, the return value is `undefined` for any root.

## Choose how much data to visit

You control which work happens during traversal:

| Return from `objectCallback` | Effect |
| --- | --- |
| `value` | Continue into this object or array normally |
| `IGNORE()` | Remove the entire branch and stop visiting its contents |
| `PASS()` | Keep the current value and skip key callbacks on its immediate properties |
| `PASS(replacement)` | Use a replacement with the same rule as `PASS()` |
| `FINISH()` | Omit the current branch and stop the entire walk |
| `FINISH(value)` | Process the final branch with key callbacks and `isFinished:true`, then stop; without a key callback, include it directly |

### Skip a branch

Return `IGNORE()` before entering an object or array. None of its descendants will reach either callback.

```js
let data = { name:'Peter', archive:{ events:[1,2,3], details:{ count:3 } } };

let result = walk ({
                          data
                        , objectCallback : ({ value, key, IGNORE }) => key === 'archive' ? IGNORE() : value
                    })
// { name:'Peter' }
```

From `keyCallback`, `IGNORE()` removes just that leaf. From the root object callback, it returns an empty object or array matching the original root type.

### Pass immediate values through

Return `PASS()` when an object's immediate values should avoid `keyCallback`. Nested objects and arrays still run `objectCallback`, and their own values run `keyCallback` normally.

```js
let data = { branch:{ count:2, nested:{ count:3 } }, outside:1 };

let result = walk ({
                          data
                        , objectCallback : ({ value, key, PASS }) => key === 'branch' ? PASS() : value
                        , keyCallback    : ({ value }) => value * 2
                    })
// { branch:{ count:2, nested:{ count:6 } }, outside:2 }
```

To change the object and skip its immediate key callbacks, provide a replacement:

```js
let result = walk ({
                          data : { branch:{ count:2, nested:{ count:3 } } }
                        , objectCallback : ({ value, key, PASS }) => key === 'branch' ? PASS ({ ...value, count:100 }) : value
                        , keyCallback    : ({ value }) => value * 2
                    })
// { branch:{ count:100, nested:{ count:6 } } }
```

`PASS()` keeps the current value; `PASS(undefined)` explicitly replaces it with `undefined`. Simple replacements, including supported built-in values, are stored directly without `keyCallback`. For arrays, the rule covers immediate leaf elements and additional leaf properties. Root `PASS()` follows the same rule.

Call the helpers and return their result. Returning the `IGNORE` or `PASS` function itself stores a function value. The internal instructions returned by these helpers do not appear in the result.

## Deep forEach

Use a callback to collect values, count entries, validate data, or log locations throughout a nested structure. Set `settings.copy:false` to run the walk without building a copied structure. You write the operation once; `walk` finds the matching values at every depth.

```js
let data = {
                  scores  : [10,20]
                , profile : { score:30 }
                , archive : { scores:[100,200] }
            };
let total = 0;

walk ({
          data
        , settings : { copy:false }
        , objectCallback : ({ value, key, IGNORE }) => key === 'archive' ? IGNORE() : value
        , keyCallback : ({ value }) => {
                              if ( typeof value === 'number' )   total += value
                              return value
                          }
    })
// total === 60
```

This is a deep `forEach` pattern with control over traversal. `IGNORE()` avoids visiting unwanted branches; `PASS()` avoids immediate key callbacks while continuing into nested containers. That can reduce the work compared with processing every value.

With copying disabled, `walk` returns `undefined`. It does not allocate result objects or arrays or insert copied properties. Paths and traversal bookkeeping are still prepared as needed.

Callback rules stay the same: `IGNORE()` stops a branch, `PASS()` skips immediate key callbacks, and returned containers are still visited. `objectCallback` should return `value` to continue into an unchanged container; omitting its return stops traversal at that location. A `keyCallback` used only for side effects may omit its return. Return `value` if the same callback will also be used while copying.

Returning a replacement changes what is visited without assigning that replacement to the source. Walk does not modify the input by itself; callbacks can still modify objects they receive. Omit `copy:false` to create a result as usual.

## Finish when the job is done

Both callbacks receive `FINISH`. Its instruction must be returned, just like `IGNORE()` and `PASS()`. The two callbacks finish at different points:

| Callback and return | Effect |
| --- | --- |
| Either callback: `FINISH()` | Omit the current value or branch, then stop immediately |
| `keyCallback`: `FINISH(value)` | Include the supplied value directly, then stop immediately |
| `objectCallback`: `FINISH(value)` | Select this final branch, run its key callbacks with `isFinished:true`, then stop |

Later siblings and unrelated pending containers are not visited. In the selected final branch, nested objects and arrays are traversed for their leaf values, without further object callbacks. `isFinished` is `false` during ordinary key callbacks, and `true` for key callbacks processing that final branch, including replacement containers they return.

```js
let data = [12,22,33,44,55,66];

let result = walk ({
                          data
                        , keyCallback : ({ value, FINISH }) => {
                                              if ( value === 33 )   return FINISH ( value )
                                              return value
                                          }
                    })
// [12,22,33]
```

Change the stopping return to `FINISH()` to get `[12,22]`. An explicit argument counts even when its value is `undefined`: `FINISH(undefined)` includes that value, while `FINISH()` omits it.

An object callback can select a final branch:

```js
let data = { a:12, b:15, c:{ internal:44, in1:'bbb', in2:'ccc' }, after:55 };

let result = walk ({
                          data
                        , objectCallback : ({ key, value, FINISH }) => key === 'c' ? FINISH ( value ) : value
                    })
// { a:12, b:15, c:{ internal:44, in1:'bbb', in2:'ccc' } }
```

This example has no key callback, so the supplied branch is included directly: `result.c === data.c`. With `FINISH()` instead, the result is `{ a:12, b:15 }`.

When a key callback exists, it controls what gets copied from that final branch:

```js
let result = walk ({
                          data : { a:12, b:15, c:{ internal:44, in1:'bbb', in2:'ccc' }, after:55 }
                        , objectCallback : ({ key, value, FINISH }) => key === 'c' ? FINISH ( value ) : value
                        , keyCallback : ({ value, isFinished, FINISH }) => {
                                              if ( isFinished )   return FINISH ( value )
                                              return value
                                          }
                    })
// { a:12, b:15, c:{ internal:44 } }
```

Choose a different return while `isFinished` is true to change the final branch:

| Return from the final key callbacks | Result inside `c` in this example |
| --- | --- |
| `value` | `{ internal:44, in1:'bbb', in2:'ccc' }` |
| `IGNORE()` | `{}` |
| `FINISH(value)` on the first leaf | `{ internal:44 }` |
| `FINISH()` on the first leaf | `{}` |

These examples use a flat final object. For nested data, ignoring every leaf preserves its containers, possibly empty. Stopping at the first leaf can leave containers already allocated before it. Values are visited in `Object.keys` order; choosing the first property depends on that order.

`FINISH(value)` returned from a key callback includes the supplied value directly, including object or array references, without visiting its contents. From an object callback with no key callback, it also includes the value directly. With a key callback, the final branch is copied and transformed using the normal leaf return rules and cycle detection. `PASS()` on an earlier container does not suppress key callbacks in a newly selected final branch. Returning the `FINISH` function without calling it stores an ordinary function value, just like the other helpers.

The result contains work already completed, without completing unrelated pending containers. For example, returning `FINISH()` from the key callback at `stop` in `{ queued:{ number:1 }, stop:2 }` leaves `{ queued:{} }`: the container was allocated before its contents were visited. Callback order stays the same within the selected work. On the root object callback, `FINISH()` returns an empty object or array matching the input root; `FINISH(value)` follows the same final-branch rule. A simple root replacement is returned directly without a key callback, as with ordinary root replacements.

With `settings.copy:false`, either form stops traversal and walk still returns `undefined`. Collect a match outside the callback when searching:

```js
let found;

walk ({
          data : [{ id:1 },{ id:2 },{ id:3 }]
        , settings : { copy:false }
        , objectCallback : ({ value, FINISH }) => {
                              if ( value.id === 2 ) {
                                      found = value
                                      return FINISH()
                                  }
                              return value
                          }
    })
// found: { id:2 }
```

Stopping belongs to that walk only. Finishing a nested `walk` call does not finish the outer call.

## Paths when you need them

Both callbacks receive `breadcrumbs` and `parentPath` by default:

| Location | `key` | `parentPath` | `breadcrumbs` |
| --- | --- | --- | --- |
| Root object callback | `'root'` | `[]` | `'root'` |
| `data.profile.age` | `'age'` | `['root','profile']` | `'root/profile/age'` |
| `data.items[0].name` | `'name'` | `['root','items','0']` | `'root/items/0/name'` |

Build a full path with `[ ...parentPath, key ]`. Parent arrays are frozen and shared by siblings; create a new array when extending one.

Use the array when property names contain `/`: `data['a/b'].c` has parent path `['root','a/b']`, while `data.a.b.c` has `['root','a','b']`. Both locations have the breadcrumb string `'root/a/b/c'`, so splitting breadcrumbs cannot reliably recover a path.

Array keys refer to input locations, even when filtering changes the indexes in the result.

### Settings

Disable paths your callbacks do not use:

```js
let result = walk ({
                          data : { password:'secret', name:'Peter' }
                        , settings : { breadcrumbs:false, parentPath:false }
                        , keyCallback : ({ value, key, IGNORE }) => key === 'password' ? IGNORE() : value
                    })
// { name:'Peter' }
```

| Setting | Default | Effect of `false` |
| --- | --- | --- |
| `copy` | `true` | Walk without building a result; return `undefined` |
| `breadcrumbs` | `true` | Skip preparing breadcrumb strings |
| `parentPath` | `true` | Skip preparing parent-path arrays |
| `detectCycles` | `true` | Skip circular-reference checks and their bookkeeping |

Only literal `false` disables a setting. Omitted settings remain enabled. Disabled path fields are absent from callback arguments; destructuring them gives `undefined`. With no callbacks, neither path is prepared.

Path preparation takes time and memory. Parent arrays grow with depth, so disabling unused paths is especially useful for deeply nested data. Path settings change metadata preparation. The `copy` setting controls result creation independently: `settings:{ copy:false }` still provides both paths, while `settings:{ copy:false, breadcrumbs:false, parentPath:false }` skips all three kinds of work.

Set `detectCycles:false` when you know the visited data and callback replacements have no circular references. This skips ancestor records, depth tracking, parent checks, and lookup maintenance. It is independent of copying and paths:

```js
let data = JSON.parse ( '{"items":[1,2,3]}' );
let total = 0;

walk ({
          data
        , settings : { copy:false, breadcrumbs:false, parentPath:false, detectCycles:false }
        , keyCallback : ({ value }) => { total += value }
    })
// total === 6
```

With detection disabled, callbacks must prune any cyclic branches before revisiting them; otherwise walk can continue indefinitely. Returned containers are subject to the same rule.

## Measurements with different data structures

Structure and settings both affect execution time. These measurements use the upcoming v7 implementation, with both callbacks returning `value` and no branches skipped. Times are milliseconds for one complete walk.

The inputs contain no circular references:

- **Flat object:** 1,000,000 properties named `key0` through `key999999`, each holding its index as a number.
- **Nested records:** an array of 100,000 records shaped as `{ id, name:'item', metadata:{ active:true, score:id, tags:['a','b'] } }`. There are 600,000 leaf values.
- **Deep chain:** 4,000 nested `child` links ending in `{ leaf:1 }`. There is one leaf value.

| Operation and settings | Flat object | Nested records | Deep chain |
| --- | ---: | ---: | ---: |
| Copy, all settings enabled | 316.35 | 128.18 | 7.83 |
| Copy, both paths disabled | 303.84 | 89.55 | 0.76 |
| Walk without copying, both paths enabled | 234.43 | 105.68 | 7.60 |
| Walk without copying, both paths disabled | 225.21 | 70.20 | 0.77 |
| Walk without copying, both paths and cycle detection disabled | 223.26 | 65.12 | 0.49 |

"Both paths disabled" means `settings:{ breadcrumbs:false, parentPath:false }`. "Without copying" adds `copy:false`; the last row also adds `detectCycles:false`. Cycle detection remains enabled in the other rows. Without callbacks, walk skips preparing both paths automatically.

Measured on October 3, 2026, using Node v26.10.0 on macOS arm64, an Apple M3 Max, and 128 GiB of RAM. Each settings combination received three warmup runs, followed by six samples with cycle detection enabled and disabled in alternating order. Results use the upper median of those six samples. Flat and nested inputs were walked once per sample; deep inputs were walked five times per sample and averaged before taking the median. Input construction and explicit garbage collection between samples were outside the timed work.

Preparing parent paths has a larger effect on the deep chain because the arrays grow at every level. Disabling cycle detection helps on nested data; the flat object showed no meaningful gain. Small differences, such as 0.76 versus 0.77 ms, should be treated as measurement variation.

These are examples from one machine, rather than guaranteed timings. Callback work, runtime, hardware, and data shape change the result. Measure your own workload, and disable only features you do not need. Use `detectCycles:false` only when visited branches have no circles or callbacks prune them.

### Memory use

`copy:false` avoids allocating the result, but traversal still needs temporary keys, queue entries, callback arguments, paths, and cycle bookkeeping. These measurements use the same three inputs and pass-through callbacks described above, with cycle detection enabled throughout.

The table shows the **largest observed extra JavaScript heap usage during one walk**, in MiB (1 MiB = 1,048,576 bytes). The input is already allocated and garbage-collected before the baseline is recorded, so its memory is excluded:

| Operation and settings | Flat object | Nested records | Deep chain |
| --- | ---: | ---: | ---: |
| Copy, all settings enabled | 140.32 | 140.76 | 4.92 |
| Copy, both paths disabled | 136.07 | 84.84 | 2.20 |
| Walk without copying, both paths enabled | 31.30 | 119.70 | 4.40 |
| Walk without copying, both paths disabled | 31.31 | 50.05 | 2.20 |

Temporary allocations and garbage collection affect those figures. They describe sampled heap usage, rather than total bytes allocated or an exact peak. Disabling unused paths reduced observed heap usage substantially on the nested records and deep chain. The flat object showed little path-related difference when walking without copying.

The memory retained after garbage collection answers a different question: how much remains while the result is kept? These figures use default path settings and keep the input reachable:

| Structure | Input heap | Extra heap with copy retained | Extra heap without copying |
| --- | ---: | ---: | ---: |
| Flat object | 77.76 | 48.05 | 0.04 |
| Nested records | 12.97 | 29.23 | 0.12 |
| Deep chain | 0.13 | 0.27 | 0.05 |

All values are MiB. The small residual increases include runtime and compiled-code overhead; they are not copied data. Disabling paths left the retained copy sizes essentially unchanged. After releasing each result and collecting again, the median heap increase was below 0.12 MiB for every combination. This checks these workloads; it does not establish that every possible callback or input is free of memory leaks.

Measured on October 3, 2026, using Node v26.10.0 on macOS arm64, an Apple M3 Max, and 128 GiB of RAM. Each of the 12 combinations ran five times in fresh, sequential Node processes, with rotating settings order and no warmup walks. Heap usage was sampled every 1,024 callbacks for the flat object and nested records, every 64 callbacks for the deep chain, and immediately after traversal. Explicit garbage collection ran before the input baseline, after traversal with the result retained, and after releasing the result; none was forced during traversal. Tables show the median of the five samples. Instrumented memory runs are separate from the timing measurements above.

The [benchmark script](benchmarks/memory.mjs) and [complete samples](benchmarks/memory.results.json) include ranges, source identification, callback counts, and the process RSS high-water mark through the walk. RSS includes Node, input construction, and other memory outside the JavaScript heap; it is reported separately using [Node's resource-usage API](https://nodejs.org/api/process.html#processresourceusage).

Reproduce the measurements from the repository root:

```sh
node benchmarks/memory.mjs
```

The script enables garbage collection in its worker processes, verifies the expected callback counts and result samples, and writes fresh measurements to `benchmarks/memory.results.json`.

### Generated regression tests

The [generated test suite](test/11-generated.test.js) uses 32 fixed seeds, so a failing structure can be reproduced. It checks 768 transformation cases across copying, path settings, and cycle detection. Inputs mix objects, sparse arrays, unusual property names, primitives, built-in leaves, shared containers, and circular references. Some branches exceed the depth at which ancestor lookup changes. Circular inputs are tested with detection enabled; acyclic inputs exercise both detection settings.

Transformations are compared with a separate recursive reference implementation. Tests check transformed values, key order, array compaction, independent copies of shared containers, ancestor links, callback metadata, `IGNORE()`, local `PASS()`, replacements, and unchanged source containers. Another 384 early-finish combinations check omitted or retained final values, stopping at the visited leaf prefix, discarded pending work, and final-branch key callbacks after `PASS()`.

Run all regression tests and enforce full source coverage with:

```sh
npm run cover
```

## What gets copied

`walk` creates new containers for objects and arrays. It works with their own enumerable string keys. Primitives retain their values, and the following values retain their references:

| Value | Behaviour |
| --- | --- |
| Functions and DOM nodes | Same reference in the result |
| `Date`, `RegExp` | Same reference in the result |
| `Map`, `Set`, `WeakMap`, `WeakSet` | Same reference in the result |
| `ArrayBuffer`, `DataView`, typed arrays | Same reference in the result |

These values reach `keyCallback` as leaves; their contents are not walked. The same rules apply to values returned by callbacks.

```js
let data = { profile:{ name:'Peter' }, when:new Date ( '2026-01-15' ), greet:() => 'Hello' };
let result = walk ({ data })

result.profile !== data.profile  // true: a new object
result.when === data.when        // true: the same Date
result.greet === data.greet      // true: the same function
```

The result is editable; `walk` does not freeze it. Copying alone does not modify the source. Callback values refer to the source or a returned replacement, so modifying `value` inside a callback can modify the original data. Return a new object, as in `PASS ({ ...value, count:100 })`, when you want to avoid that.

Array elements are copied into consecutive indexes. Sparse holes and ignored elements are omitted. Additional enumerable properties such as `'-1'` and `'01'` keep their names. Arrays from another JavaScript context are recognized as arrays.

### Circular references

A reference back to a parent becomes a reference to that parent's copy. Walk closes the circle without visiting the parent's contents again:

```js
let data = { number:1 };
data.self = data

let result = walk ({ data })
result !== data         // true: a new object
result.self === result  // true: the circle stays inside the copy
```

Object callbacks still run at circular properties, so they can remove the reference with `IGNORE()` or replace its value. Detection checks the returned container against its ancestors; containers returned by `keyCallback` follow the same rule. With `settings.copy:false`, walk stops at the circular reference without building a result. Path settings do not affect detection.

Detection is enabled by default. Only literal `false` in `settings.detectCycles` disables it.

An object shared by separate branches is copied independently in each branch. Only a reference back to an ancestor closes a circle. Walk checks the short parent chain for shallow data and uses an internal ancestor lookup for deeper branches.

## Callback order

`objectCallback` sees the root first. At each container, keys are processed in `Object.keys` order. Nested object callbacks run when their property is encountered; processing those containers' contents is deferred until the current container's keys finish. Containers are then processed in the order they were scheduled.

Object callbacks see containers before their contents reach key callbacks. Replacement containers follow the same traversal rules. `IGNORE()` prevents further visits within a branch; `PASS()` affects only immediate key callbacks. `FINISH()` stops immediately. `FINISH(value)` from a key callback includes that value directly and stops immediately; from an object callback, it processes only the final branch through key callbacks with `isFinished:true`, without further object callbacks, then stops. Without a key callback, the supplied final value is included directly.

Nested containers are processed iteratively through a work queue. Processed entries are cleared as the walk advances, releasing their references to containers and paths.

Callbacks can make another finite `walk` call. Returning a container normally is enough to let the current walk visit its contents; an additional walk performs additional work.

## Reuse your rules

Keep related transformations in one callback instead of making a separate copy for each rule. When a rule is useful in several places, create a callback factory:

```js
function omitKeys ( ...keys ) {
    const omitted = new Set ( keys );
    return ({ value, key, IGNORE }) => omitted.has ( key ) ? IGNORE() : value
} // omitKeys func.

let result = walk ({
                          data : { name:'Peter', password:'secret', token:'abc' }
                        , keyCallback : omitKeys ( 'password', 'token' )
                    })
// { name:'Peter' }
```

The factory is your application code. `walk` stays focused on traversal, callbacks, and building the result.

## Scope

- With cycle detection enabled, circular references to ancestors are preserved inside the copy. Repeated references on separate branches are copied independently; their shared identity is not preserved.
- Non-enumerable and symbol keys, object prototypes, and property descriptors are not preserved. Enumerable getters contribute their returned values.
- Callbacks are synchronous. Returned promises are not awaited. For asynchronous callbacks, see [walk-async](https://github.com/PeterNaydenov/walk-async).
- Built-in values listed above are shared by reference. Use a suitable clone operation for those values if they need independent copies.

## Links

- [Release history](Changelog.md)
- [Migration guide](Migration.guide.md)
- [walk-async](https://github.com/PeterNaydenov/walk-async)

## Credits

Created and maintained by Peter Naydenov.

## License

Released under the MIT License.
