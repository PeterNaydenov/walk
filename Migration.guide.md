# Migration Guides


## From v.6.x.x - v.7.x.x

`IGNORE` is now a function. In both callbacks, replace `return IGNORE` with `return IGNORE()`:

```js
// version 6
keyCallback : ({ value, key, IGNORE }) => key === 'password' ? IGNORE : value

// version 7
keyCallback : ({ value, key, IGNORE }) => key === 'password' ? IGNORE() : value
```

The function takes no arguments. Its result drops a single key from `keyCallback`, or an entire branch from `objectCallback`, including the root. Returning the function itself is an ordinary function value and no longer removes anything. TypeScript now declares this argument as `IgnoreFunction`.

### Agent skill

The skill is now named `walk` and lives in `skills/walk/`, replacing
`.agents/skills/git-walk/`. Update any installer or integration pointing at
the old folder and include the complete folder with its linked references.
See [skill integration](skills/README.md).

### Settings, parentPath and PASS

Existing calls do not need a `settings` object. Both callbacks now receive a read-only `parentPath` array by default, alongside `breadcrumbs`. The parent path excludes `key`; the root `objectCallback` receives `parentPath:[]` and `key:'root'`.

Set `settings.breadcrumbs` or `settings.parentPath` to literal `false` to skip preparing an unused argument. Omitted settings remain enabled. Disabled arguments are absent, so destructuring them gives `undefined`; TypeScript declares both metadata fields as optional.

```js
let result = walk ({
                          data
                        , settings : { breadcrumbs:false, parentPath:false }
                        , keyCallback : ({ value }) => value
                    })
```

Default calls now prepare parent arrays when callbacks are present. Disable `parentPath` when the callback does not use it, particularly for deeply nested data. With no callbacks, both paths are skipped automatically.

`objectCallback` also receives the `PASS` function. Return `PASS()` to copy the current value and skip `keyCallback` only on its immediate properties, or `PASS(modifiedValue)` to use a replacement with the same rule. Nested objects and arrays still run their own callbacks normally. `IGNORE()` removes the entire branch and stops visiting its contents.

`PASS()` and `PASS(undefined)` have different meanings: the first keeps the current value; the second explicitly replaces it with `undefined`. A simple replacement is stored directly without `keyCallback`. Neither instruction appears in the result.

### Finish the entire walk

Both callbacks now receive the `FINISH` function. Like `IGNORE()` and `PASS()`, its instruction must be returned. Calling it without returning the instruction has no effect on traversal.

```js
let result = walk ({
                          data : [12,22,33,44,55,66]
                        , keyCallback : ({ value, FINISH }) => {
                                              if ( value === 33 )   return FINISH ( value )
                                              return value
                                          }
                    })
// [12,22,33]
```

`FINISH()` omits the current value or branch and stops immediately. From `keyCallback`, `FINISH(value)` includes the supplied value directly and stops immediately, without copying or visiting its contents. An explicit argument counts even when it is `undefined`.

From `objectCallback`, `FINISH(value)` selects the final branch. If a key callback exists, it processes the supplied value's leaves with the new boolean argument `isFinished:true`, including nested containers and containers returned by key callbacks. No further object callbacks run, and unrelated pending work is discarded. Ordinary key callbacks receive `isFinished:false`. Return `value` to preserve final leaves, `IGNORE()` to drop them while continuing through the final branch, or `FINISH()` / `FINISH(value)` to stop immediately at a final leaf. Dropping leaves can leave empty nested containers. Earlier `PASS()` instructions do not suppress key callbacks in the selected final branch.

Without a key callback, `FINISH(value)` from an object callback includes the value directly. Supplied objects and arrays then keep their references. With a key callback, the final branch is copied using the normal leaf return rules and cycle detection. A simple root replacement remains a direct return without a key callback, matching the existing root contract.

When copying, the result contains work completed before stopping. Unrelated containers already allocated but waiting for traversal can remain empty or partially populated. Finishing from the root object callback without a value returns an empty object or array matching the input root; supplying a container follows the final-branch rule. Without copying, finishing still controls traversal and walk returns `undefined`. Collect search results externally in that mode.

This is an optional addition; existing callbacks do not need changes. Finishing is local to each walk, including nested calls. TypeScript declares the shared helper as `FinishFunction` and the key callback arguments as `KeyCallbackArgs`, including `isFinished:boolean`.

### Walk without a copy

Set `settings.copy` to literal `false` to run callbacks without creating result objects or arrays. Walk returns `undefined` in this mode, including for simple, ignored, or replaced roots. Copying remains enabled when the setting is omitted or has any other value.

```js
let values = [];
walk ({
          data : { number:1, nested:{ number:2 } }
        , settings : { copy:false }
        , keyCallback : ({ value }) => { values.push ( value ) }
    })
// values: [1,2]
```

Callback order and path arguments stay the same. `IGNORE()` still prunes branches; `PASS()` and `PASS(value)` still skip immediate key callbacks while visiting nested objects normally. Returned replacement containers are visited without being assigned to the source.

An object callback must still return the current or replacement value to continue into it. A key callback used only for side effects may omit its return. Metadata settings are independent of copying; disable unused paths separately.

### Circular references

Walk now detects references back to an ancestor instead of following them indefinitely. When copying, the reference points to that ancestor's copy: if `data.self === data`, then `result.self === result`. With `settings.copy:false`, traversal stops at that edge and returns `undefined` as usual.

Object callbacks still receive circular properties and can ignore or replace them. The returned container is checked against the current branch's ancestors before visiting its contents. This also applies to containers returned by `keyCallback`. Repeated references on separate branches are still copied independently. No new setting or callback argument is required; detection works with both path settings disabled.

Detection defaults to true. Set `settings.detectCycles` to literal `false` to skip the checks and all ancestor bookkeeping when the visited data and callback replacements are known to be acyclic. Omitted settings and other values keep detection enabled. Copying and metadata settings remain independent.

```js
let result = walk ({
                          data : JSON.parse ( '{"nested":{"number":1}}' )
                        , settings : { detectCycles:false }
                    })
// { nested:{ number:1 } }
```

With detection disabled, callbacks must prune cyclic branches before revisiting them; otherwise traversal can continue indefinitely. Callback order and return rules are unchanged.

### Traversal performance

Nested containers now use a work queue instead of generator wrappers. Processed entries are cleared to release their container and path references earlier. Callback order and return behaviour stay the same; no changes to your callbacks are required for this optimization. Walk no longer uses generator functions, so a generator polyfill is no longer needed for the library itself.

Pending descendants keep links to their ancestor containers for circular-reference detection. Shallow branches use the short parent chain; deeper branches use an internal lookup containing only the current branch's ancestors. This avoids repeatedly scanning long chains. Detection adds bookkeeping even when path preparation is disabled.



## From v.4.x.x - v.5.x.x
Walk version 5 has change in object callbacks. Will be triggered on 'root' instance as well. If you want to make old object callbacks to work single row can do this for you:

```js
// version 4
function oCallbackFn ({ value:o, key, IGNORE }) {
                          if ( o[0] === 5     ) return o
                          return IGNORE
                      }

// version 5
function oCallbackFn ({ value:o, key, IGNORE }) {
                          if ( key === 'root' ) return o // Extra line of code for version 5
                          if ( o[0] === 5     ) return o
                          return IGNORE
                      }
```
Everything else works the same.




## From v.3.x.x - v.4.x.x
Walk version 4 provides support for all javascript primitive types including `null` and `undefined`.
Untill version 3, callback returns `null` if value should be **ignored**. Walk v.4 provides argument constant `IGNORE`. Return it if need to ignore. Returning of `null` and `undefined` will be treated as standard values. 

```js
//v.3
function someKeyCallback ({value, key, breadcrumbs }) {
            if ( value == 'something' )   return null   // will cancel 
            return value
    }

// v.4
function someKeyCallback ({value, key, breadcrumbs, IGNORE }) {
            if ( value == 'something' )   return IGNORE   // will cancel 
            return value
    }
```

That's all changes needed to move from v.3.x.x to v.4.x.x.




## From v.2.x.x. - v.3.x.x
Major changes are related to moving from multiple arguments to named arguments.

```js
const someData = { a: 12, b: ['one', 'two'] }
// old:
const result = walk ( someData )
// new:
const result = walk ({ data: someData })
```

Calling `walk` with keyCallback
```js
// old
// - first version:
const result = walk ( someData, keyCallbackFn ) 
// - second version:
const result = walk ( someData, [keyCallbackFn,null])

// new:
const result = walk ({ data:someData, keyCallback: keyCallbackFn })
```

Calling `walk` with both callbacks:
```js
//old:
const result = walk ( someData, [keyCallbackFn, objectCallbackFn])
// new:
const result = walk ({ 
                          data:someData
                        , keyCallback:keyCallbackFn
                        , objectCallback:objectCallbackFn 
                    })
```

Definition for objectCallbacks:
```js
// old
function callback ( obj, key, breadcrumbs ) {
        //... some actions
    }

// new
function callback ({ value, key, breadcrumbs }) {
        //... some actions
    }
```

Definition for keyCallbacks:
```js
// old
function callback (value,key,breadcrumbs) {
         //... some actions
    }


function callback ({value,key,breadcrumbs}) {
         //... some actions
    }
```
