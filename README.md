# Walk (@peter.naydenov/walk)

![version](https://img.shields.io/github/package-json/v/peterNaydenov/walk)
![license](https://img.shields.io/github/license/peterNaydenov/walk)
![npm](https://img.shields.io/npm/dt/%40peter.naydenov/walk)
![GitHub issues](https://img.shields.io/github/issues/peterNaydenov/walk)
![GitHub top language](https://img.shields.io/github/languages/top/peterNaydenov/walk)
![npm package minimized gzipped size (select exports)](https://img.shields.io/bundlejs/size/%40peter.naydenov%2Fwalk)




`walk` visits every member of a JavaScript data structure **once**, in a single pass. Two callbacks run during the visit:

- `objectCallback` fires on every object or array (including the root)
- `keyCallback` fires on every primitive property

Both callbacks can transform the value as the walk proceeds — modify a property, set a value conditionally, or drop a whole subtree. The deep copy of the original data is mostly a side-effect: the real power of `walk` is the ability to do all your modifications in one pass, with full freedom inside a single callback.

```js
const result = walk ({
                            data             // (required) Any JS data structure;
                          , objectCallback   // (optional) Function executed on each object/array property;
                          , keyCallback      // (optional) Function executed on each primitive property;
                    })
// `result` is an immutable copy of `data` if callbacks are absent
// or return each value unchanged.
```


> **When to use `walk` vs `structuredClone`.**
> `structuredClone` is built into modern browsers and Node 17+ and is the right tool when you just need a deep copy. Reach for `walk` when you want to **modify particular properties, set values conditionally, or skip whole branches** during the copy — all in a single pass over the data. If you don't need transformations, `structuredClone` is faster and ships with the platform.


## Order of execution

A few invariants to keep in mind — they shape the order in which your callbacks fire and are easier to reason about up front than to discover in the source:

- **Within one level, keys are visited in `Object.keys` order.** That's the order of own enumerable string keys on the current object/array.
- **A level finishes before any nested walk starts.** When `walk` hits an object/array value (original or returned by a callback), it allocates the result container and defers the nested walk. The nested walk runs after the current level's iteration completes. New objects/arrays returned by `keyCallback` or `objectCallback` are scheduled the same way, so the iteration order of the current level is preserved.
- **`objectCallback` runs before `keyCallback` on the same value.** For every object/array, `objectCallback` fires first; if it returns a new object, that object is what gets walked; its primitive children are then handed to `keyCallback`.
- **The root is treated as a normal object/array.** When `data` is an object/array, the root goes through `objectCallback` first (if defined), then its children are walked. Returning `IGNORE` from the root `objectCallback` short-circuits the whole walk to an empty result.





## keyCallback
`walk` visits each member of the data once. `keyCallback` fires on every primitive property — types: *string, number, bigint, boolean, symbol, null, undefined, function*. Object and array values are visited by `objectCallback` instead (see below). Built-in types like `Date`, `Map`, `Set`, and typed arrays arrive at `keyCallback` as primitives and are passed through by reference — see [Built-in types](#built-in-types-date-regexp-map-set-typed-arrays-etc) below.

The value you return from the callback becomes the new value at that key:

- **Return a primitive (or a built-in like `Date` / `Map` / `Set`)** → stored as-is. Walk does not descend into it;
- **Return a plain object or array** → walk continues into it with `objectCallback` and `keyCallback` applied to its children (same as any original nested object/array). The new walk is deferred via the `extend` mechanism, so the iteration order of the current level is preserved;
- **Return the `IGNORE` constant** → that key is dropped from the result.

```js
function keyCallbackFn ({value,key,breadcrumbs, IGNORE }) {
    // value: value for the property;
    // key:  key of the property;
    // breadcrumbs: location of the property;
    // IGNORE: constant. Return it if key-value pair should be ignored;
    // Callback should return the value of the property. To ignore property, return constant argument IGNORE
  }

let result = walk ({ data, keyCallback: keyCallbackFn });  // It's the short way to provide only key-callback. Callback functions are optional.
// let result = walk ({ data, keyCallback, objectCallback });  // If both callbacks are available
```


## objectCallback

Optional callback function that is started on each object property including 'root'. The value you return from the callback becomes the new value at that key:

- **Return the same (or a modified) object/array** → walk continues into it with the other callbacks applied to its children;
- **Return a primitive** (string, number, `null`, etc.) → it is stored at that key as-is, and walk does not descend into it (primitives have no children to walk);
- **Return the `IGNORE` constant** → that key is dropped from the result.

```js
function objectCallbackFn ({ value, key, breadcrumbs, IGNORE }) {
      // value: each object during the walk
      // key: key of the object
      // breadcrumbs: location of the object
      // IGNORE: Constant. Return it if key-value pair should be ignored;
      // object callback should return something.
}

let result = walk ({ data, keyCallback:keyCallbackFn, objectCallback : objectCallbackFn })
```

**IMPORTANT: Object-callbacks are executed always before key-callbacks. If we have both callbacks, then key-callbacks will be executed on the result of object-callback.**

Skip key-callbacks by not defining them:
```js
 let result = walk ({ data, objectCallback: objectCallbackFn })   // ignore keyCallback
```


## Why one callback, not a list of methods

`walk` is built around a single pass over the data — every member is visited exactly once, no matter how many transformations the callbacks perform. This is the whole reason the API exposes a callback (or two, for objects vs primitives) and not a bag of pre-built methods like `omit`, `pick`, or `set`.

Each pre-built method would be another pass over the data: dropping one key, then renaming another, then masking a third — that's three O(n) cycles where one would do. The cost compounds with every method you chain, and on large data it gets expensive fast.

A single `keyCallback` (and optionally `objectCallback`) lets you do every transformation you need in the same pass — drop a key, mask a value, rename another, conditionally remove a subtree — all together, no extra cycles.

If you find yourself wanting a named transformation you can reuse, the natural place for it is a **callback factory**: a function that returns a `keyCallback` / `objectCallback`. Such factories can live in a separate package; they don't need to extend `walk` itself.

```js
// Example callback factory — not part of walk
function omitKeys (...keysToDrop) {
    const set = new Set ( keysToDrop )
    return ({ key, value, IGNORE }) => set.has ( key ) ? IGNORE : value
}

let result = walk ({
      data: user
    , keyCallback: omitKeys ( 'password', 'token' )
})
```


## Installation

Install for node.js projects by writing in your terminal:

```
npm install @peter.naydenov/walk
```

Once it has been installed, it can be used by writing this line of JavaScript:
```js
import walk from '@peter.naydenov/walk'
```



## How to use it

### Deep copy
```js
let myCopy = walk ({ data:x })   // where x is some javascript data structure
```


### Built-in types (Date, RegExp, Map, Set, typed arrays, etc.)
`walk` operates on the own-enumerable-string-key model. Values whose data lives outside that model are **preserved by reference** — the same instance appears in the result:

| Type                                     | Behavior                                  |
| ---------------------------------------- | ----------------------------------------- |
| `Date`, `RegExp`                         | Passed by reference                       |
| `Map`, `Set`, `WeakMap`, `WeakSet`       | Passed by reference                       |
| `ArrayBuffer`, `DataView`, typed arrays  | Passed by reference                       |
| DOM nodes (`HTMLElement`, etc.)          | Passed by reference                       |
| Functions                                | Passed by reference                       |

```js
const x = { when: new Date ( '2024-01-15' ), tags: new Set ([ 'js' ]) }
const r = walk ({ data: x })
r.when === x.when   // true  — same Date instance
r.tags === x.tags   // true  — same Set instance
```

This is the same contract used by `function` values and DOM nodes. If you need a deep copy of a `Map`/`Set`/typed array, do it yourself before calling `walk`, or use the platform `structuredClone` for those particular subtrees.


### Deep 'forEach'
`keyCallback` can be used as a deep `forEach` over every primitive property of the data — no matter how deeply nested. Unlike a plain `forEach`, **the callback must return a value**: that returned value is what ends up in the result. To walk without changing anything, return `value` unchanged.

```js
let x = {
          ls    : [ 1,2,3 ]
        , name  : 'Peter'
        , props : {
                      eyeColor: 'blue'
                    , age     : 47
                    , height  : 176
                    , sizes : [12,33,12,21]
                }
    };

walk ({ data:x, keyCallback : ({value,key, breadcrumbs}) => {
                  console.log (`${key} ----> ${value}`)   // Show each each primitive couples key->value
                  console.log ( `Property location >> ${breadcrumbs}`)
                  // example for breadcrumbs: 'age' will looks like this : 'root/props/age'
                  return value                            // pass-through — required, otherwise the result loses this key
              }
    })
```

`breadcrumbs` is a slash-delimited path string starting with `root` (e.g. `"root/props/age"`). Use it to know where you are in the structure; you can `.split('/')` it if you need a path array.

> Built-in types (`Date`, `Map`, `Set`, typed arrays, etc.) are reached by `keyCallback` as-is — see [Built-in types](#built-in-types-date-regexp-map-set-typed-arrays-etc) below.


### Skip a branch
Returning `IGNORE` from `objectCallback` drops the **entire subtree** at that key — not just the immediate property. Use it when you want to cut a whole section out of the result without having to walk into it and ignore it key by key.

```js
let x = {
          name      : 'Peter'
        , password  : 'secret'
        , metadata  : {
                          ip      : '1.2.3.4'
                        , session : 'abc-123'
                        , device  : { os: 'mac', browser: 'safari' }
                    }
    };

// Drop a single primitive (use keyCallback)
let r1 = walk ({
      data: x
    , keyCallback: ({ key, value, IGNORE }) => key === 'password' ? IGNORE : value
})
// r1.metadata is still fully present; only r1.password is gone.

// Drop an entire subtree (use objectCallback)
let r2 = walk ({
      data: x
    , objectCallback: ({ key, value, IGNORE }) => key === 'metadata' ? IGNORE : value
})
// r2.password is still present; the whole r2.metadata subtree is gone.
```

`objectCallback` fires on the root too, so this also works at the top level (e.g. to short-circuit a `walk` by returning `IGNORE` from the root call).


### Ignore a key

```js
let x = {
          ls    : [ 1,2,3 ]
        , name  : 'Peter'
        , props : {
                      eyeColor: 'blue'
                    , age     : 47
                    , height  : 176
                    , sizes : [12,33,12,21]
                }
    };
let result = walk ({ data:x, keyCallback : ({ value, key, IGNORE }) => {
                        if ( key === 'name' )   return IGNORE
                        return value
                })
// result will copy all properties from x without the property 'name'.
// result.name === undefined
```


### Mask values

```js
let x = {
          ls    : [ 1,2,3 ]
        , name  : 'Peter'
        , props : {
                      eyeColor: 'blue'
                    , age     : 47
                    , height  : 176
                    , sizes : [12,33,12,21]
                }
    };
let result = walk ({ data:x, keyCallback : () => 'xxx' })
// 'result' will have the same structure as 'x' but all values are 'xxx'
// {
//      ls    : [ 'xxx','xxx','xxx' ]
//    , name  : 'xxx'
//    , props : {
//                  eyeColor: 'xxx'
//                , age     : 'xxx'
//                , height  : 'xxx'
//                , sizes : ['xxx','xxx','xxx','xxx']
//             }
//   } 
```

### Change object on condition

```js
let x = {
          ls    : [ 1,2,3 ]
        , name  : 'Peter'
        , props : {
                      eyeColor: 'blue'
                    , age     : 48
                    , height  : 176
                    , sizes : [12,33,12,21]
                }
    };

function objectCallback ({ value:obj, key, breadcrumbs }) {
    if ( key === 'root' ) return obj   // Add this row to ignore 'root' object
    const {age, height} = obj;
    if ( age && age > 30 ) {
            return { age, height }
        }
    return obj
}

let result = walk ({ data:x, objectCallback })
// 'result.props' will have only 'age' and 'height' properties.
// {
//      ls    : [ 1,2,3 ]
//    , name  : 'Peter'
//    , props : {
//                  age     : 48
//                , height  : 176
//             }
//   } 
```

## Limitations
- `walk` does not descend into built-in types (`Date`, `RegExp`, `Map`, `Set`, `WeakMap`, `WeakSet`, `ArrayBuffer`, `DataView`, typed arrays, DOM nodes, functions) — they are passed by reference, whether they appear in the input or are returned by a callback;
- `walk` can not execute another `walk` from inside of the callbacks;
- It's not recomended to use any async operations in the callbacks. Could compromise the result without any warning;

These limitations are covered in a bit larger library - [walk-async](https://github.com/PeterNaydenov/walk-async). Interface is very simular but result is coming as a promise and callbacks should be resolved or rejected.

## Links
- [Release history](Changelog.md)
- [ Walk-async library](https://github.com/PeterNaydenov/walk-async)
- [ Documentation version 4.x.x](https://github.com/PeterNaydenov/walk/blob/master/README_v.4.x.x.md)
- [ Migration guide ](https://github.com/PeterNaydenov/walk/blob/master/Migration.guide.md)



## Credits
'@peter.naydenov/walk' was created and supported by Peter Naydenov.

## License
'@peter.naydenov/walk' is released under the MIT License.
