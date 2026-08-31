---
name: git-walk
description: |
  Help developers use `@peter.naydenov/walk` (the `walk` function from the
  git-walk project, v6.0.0): write a deep copy with `walk({ data })`, write
  transformations via `keyCallback` and `objectCallback`, return the
  `IGNORE` sentinel to drop a key or a whole subtree, and use the breadcrumbs
  path for navigation. Use when the developer asks for a deep copy with
  simultaneous transforms, a deep `forEach` that can drop or rewrite
  values, a single-pass clone that filters keys by name, or anything phrased
  as "deep copy / deep clone / deep walk / deep forEach" where the
  transform happens during the copy. Do NOT use for: deep-copying a
  `Map` / `Set` / `Date` / typed array (use `structuredClone` for those),
  replacing the library with a generic deep clone, async iteration
  (use the separate `walk-async` package), or fixing bugs in the library
  itself.
---

# git-walk helper

A single-pass deep walk over a JavaScript data structure. The headline
feature is that two callbacks can transform or filter values *during* the
copy — modify a key, set a value conditionally, drop a whole subtree — all
in one pass, no chain of methods. A plain deep copy is just the no-callback
case.

Source of truth:
- `src/main.js` — JSDoc on every public function and typedef (`walk`, `keyCallback`, `objectCallback`, `CallbackArgs`, `IgnoreToken`, `Options`)
- `src/findType.js` — what counts as `'simple'` vs `'object'` / `'array'`
- `src/copyObject.js` — the actual walk loop
- `test/01-general.test.js`, `test/02-keyCallback.test.js`, `test/03-objectCallback.test.js`, `test/04-builtins.test.js` — executable examples for every pattern below
- `README.md` — narrative docs (lead paragraph, "When to use `walk` vs `structuredClone`" callout, "Built-in types" table, "Order of execution" section, "Limitations")

## Procedure

1. **Map the developer's intent to the right shape of `walk({ data, ... })` call**:
   - "Just deep-copy this" / "give me an immutable copy" → `walk({ data })` (no callbacks)
   - "Drop a few keys while copying" → `walk({ data, keyCallback })`; return `IGNORE` for the keys to drop
   - "Mask a value" / "rewrite a value" → `walk({ data, keyCallback })`; return the new value
   - "Skip a whole subtree" → `walk({ data, objectCallback })`; return `IGNORE` from the object/array callback at the right key
   - "Run a function on every leaf" (deep `forEach` with side effects) → `walk({ data, keyCallback })`; the callback must still `return value` (see gotcha below)
   - "Do multiple transforms in one pass" → one `keyCallback` (and optionally one `objectCallback`) that handles all the cases — do not chain methods, that's the whole point of the library

2. **Generate code that follows the real API contract**:
   - ESM import: `import walk from '@peter.naydenov/walk'` (CJS: `require('@peter.naydenov/walk')`)
   - Signature is `walk(options, ...args)`. The options object requires `data`; `keyCallback` and `objectCallback` are optional.
   - Extra positional args passed to `walk` are forwarded to both callbacks as `...args`. Use this for context the callbacks need but you don't want to close over.
   - Callback signature is `({ value, key, breadcrumbs, IGNORE }, ...args)`. Always destructure the four fields from the first arg.
   - `IGNORE` is a `Symbol` (branded `IgnoreToken` in the `.d.ts`) that is fresh per callback call. Return the **same value you received**, never re-create a `Symbol('ignore')` yourself — the library compares by reference.
   - `keyCallback` MUST return a value. Returning `undefined` literally stores `undefined` in the result (and may overwrite an existing key). For a pass-through deep `forEach`, write `return value` explicitly.
   - `objectCallback` MUST return a value: the same object (with modifications), a new object/array, a primitive (stored as-is, no descent), or `IGNORE` to drop the subtree. Returning `undefined` is a footgun — see gotcha.

3. **Apply the order-of-execution rules**:
   - Within one level, keys are visited in `Object.keys` order on the current object/array.
   - A level finishes before any nested walk starts. The new walk into a returned object/array is **deferred** (it runs after the current level's iteration completes). Iteration order at the current level is preserved.
   - For the same value, `objectCallback` runs **before** `keyCallback`. If `objectCallback` returns a new object, that object is what `keyCallback` sees when it processes the children.
   - The root goes through `objectCallback` first (if defined), then its children are walked. Returning `IGNORE` from the root `objectCallback` short-circuits the whole walk to `[]` (for array roots) or `{}` (for object roots).

4. **Surface only the relevant gotcha proactively** — pick at most one from the list below that applies to the current example, and only if the user is unlikely to know it:
   - **Returning `IGNORE` is the only way to drop a key.** Returning `null` or `undefined` from a callback does not delete the key — it stores `null` / `undefined`. (This used to differ in pre-4.0.0; the current contract is "IGNORE to drop, anything else is a value".)
   - **Don't deep-copy the result inside a callback.** Calling `walk(...)` from inside a callback corrupts the in-progress walk — it's the first item on the Limitations list in the README. If the user needs recursion, let the library handle it by returning a plain object/array from the callback.
   - **No async work in callbacks.** A callback that does `await` something and returns a `Promise` will store a `Promise` as the value (which is `'simple'` from `findType`'s perspective). Use the separate `@peter.naydenov/walk-async` package if you need async iteration.
   - **Built-in types are not walked.** `Date`, `RegExp`, `Map`, `Set`, `WeakMap`, `WeakSet`, `ArrayBuffer`, `DataView`, typed arrays, DOM nodes, and functions are passed by reference. If the user wants a deep clone of a `Map`/`Set`/typed array, recommend `structuredClone` for that subtree, or do it themselves before calling `walk`.
   - **`'simple'` is the storage type, not the return type.** A plain object or array returned from `keyCallback` is re-typed and walked into (deferred). A `Date` returned from `keyCallback` is `'simple'` and stored by reference. This is the v6.0.0 contract — earlier versions refused to descend into anything returned by `keyCallback`.

5. **If the request is "I just need a deep clone with no transforms"**, point the user at `structuredClone` first (it's built into the platform, faster, no dependency) and mention `walk({ data })` as the fallback when they want to add transforms later. The README has a callout for this exact case.

6. **If the request is for an async deep walk**, route to `@peter.naydenov/walk-async` (separate package, similar interface but returns a Promise).

## Output contract

- One focused code snippet, ESM by default (CJS if asked)
- One line of context explaining which option(s) are used and why
- A pointer to the relevant source/test section if the developer wants to dig deeper
- Surface at most one relevant gotcha proactively, only if it applies to the example
- Never include a code example that runs `walk` from inside a callback (corrupts the result)

## Failure handling

- The developer's use case genuinely ambiguous (e.g., "deep clone this") → pick `walk({ data })` as the default and mention that `structuredClone` is the no-deps alternative
- Developer reports a bug or unexpected behavior in `walk` itself → do NOT try to fix from this skill; route to the project source or maintainer
- Developer asks for an API `walk` doesn't have (e.g., `walk.pick(...)`, `walk.omit(...)`) → do not invent it; point at the callback-factory pattern in the README ("Why one callback, not a list of methods" section) where such helpers belong outside the library

## Examples

**"Drop the `password` and `token` keys from a user object"**

```js
import walk from '@peter.naydenov/walk'

const result = walk({
  data: user,
  keyCallback: ({ key, value, IGNORE }) =>
    (key === 'password' || key === 'token') ? IGNORE : value
})
```

`IGNORE` is the only way to drop a key. Returning `null` or `undefined` from the callback would store those values instead. See "Skip a branch" in `README.md` and the `keyCallback` tests in `test/02-keyCallback.test.js`.

**"Drop a whole `metadata` subtree"**

```js
import walk from '@peter.naydenov/walk'

const result = walk({
  data: user,
  objectCallback: ({ key, value, IGNORE }) =>
    key === 'metadata' ? IGNORE : value
})
```

Returning `IGNORE` from `objectCallback` drops the entire subtree (not just the immediate property). `keyCallback` is not used here, so primitive keys inside `metadata` are never visited. See `test/03-objectCallback.test.js`.

**"Deep `forEach` — log every leaf"**

```js
import walk from '@peter.naydenov/walk'

walk({
  data: tree,
  keyCallback: ({ key, value, breadcrumbs }) => {
    console.log(`${breadcrumbs}/${key} = ${value}`)
    return value  // required — pass-through so the result is preserved
  }
})
```

`keyCallback` MUST return a value. Omitting the `return value` would store `undefined` at every leaf. The `breadcrumbs` argument is a slash-delimited path starting with `'root'`, e.g. `'root/props/age'`. See "Deep 'forEach'" in `README.md`.
