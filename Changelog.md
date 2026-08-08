# Release History



### 5.0.8 (2026-08-08)
- [x] Types: Tighten callback signatures in `types/main.d.ts`. `keyCallback` and `objectCallback` are now typed as `KeyCallback` / `ObjectCallback` over a `CallbackArgs` shape (`value`, `key`, `breadcrumbs`, `IGNORE`); `IGNORE` is exported as a branded `IgnoreToken = symbol` so TypeScript users get autocomplete and can return it from a callback. Driven from JSDoc in `src/main.js`; regenerate with `npm run build`;
- [x] Docs: Reframe the lead paragraph so the deep copy reads as a side-effect and the callback-driven modifications as the headline;
- [x] Docs: Update the "When to use `walk` vs `structuredClone`" callout to align with the single-pass / modification-focused framing;
- [x] Docs: Add a "Built-in types" subsection that documents how `Date`, `RegExp`, `Map`, `Set`, `WeakMap`, `WeakSet`, `ArrayBuffer`, `DataView`, typed arrays, DOM nodes, and functions are passed by reference;
- [x] Docs: Tighten the `objectCallback` section to enumerate the three return-value outcomes (object/array, primitive, `IGNORE`);
- [x] Docs: Rewrite the "Deep forEach" section to make the return-value contract explicit (`keyCallback` must return a value, use `return value` for a pass-through forEach);
- [x] Docs: Add a "Skip a branch" subsection that documents returning `IGNORE` from `objectCallback` to drop an entire subtree (vs `keyCallback` which only drops a single primitive key);
- [x] Docs: Reframe the `keyCallback` intro so "forEach" is the central concept, not a secondary use case;
- [x] Docs: Add a "Why one callback, not a list of methods" section that explains the single-pass architecture and points users toward callback factories (e.g. an `omitKeys(...keys)` factory) instead of pre-built methods on `walk`;
- [x] Docs: Add an "Order of execution" section that makes the key invariants visible up front (level-internal key order, deferred nested walks, `objectCallback` before `keyCallback`, root behavior);



### 5.0.7 ( 2026-07-19)
- [x] Fix: built-in object types whose data lives outside the own-enumerable-string-key model (`Date`, `RegExp`, `Map`, `Set`, `WeakMap`, `WeakSet`, `ArrayBuffer`, `DataView`, and all `TypedArray` subclasses) used to be classified as a plain `object` by `findType` and ended up as an empty `{}` in the result. They are now classified as `simple` and preserved by reference, matching the contract already used for `function` values and DOM nodes. Note: this changes the observable shape of the result when a property holds one of these types — the value is now the same reference as the input, not a plain-object copy;



### 5.0.6 ( 2026-07-12)
- [x] Upgrading of typescript to v7.x.x;
- [x] Moving from mocha testing library to vitest;
- [x] Package.json: Overwrite section was removed(no need after removing mocha);



### 5.0.5 ( 2026-07-07)
- [x] Fix: 'objectCallback' replacing the root object with a primitive value was crashing on null/undefined or producing broken results;
- [x] Fix: Own '__proto__' property was replacing the prototype of the copy instead of being copied as a regular property;



### 5.0.4 ( 2026-07-07)
- [x] Fix: Array indexes were not rebuilt for primitive items when 'objectCallback' removes items and no 'keyCallback' is provided;



### 5.0.3 ( 2026-07-07)
- [x] Fix: Top-level property named 'root' was flattened into the result or dropped;



### 5.0.2 ( 2024-10-11)
- [x] Dev dependencies update



### 5.0.1 ( 2024-12-14)
- [x] JSDoc definitions added;
- [x] TypeScript generated .d.ts files;
- [x] Some changes in package.json related to build process;



### 5.0.0 ( 2024-11-28)
- [x] Object callback will be triggered on 'root' object as well;



### 4.2.3 ( 2024-01-27)
- [x] Package.json: "exports" section was added. Allows you to use package as commonjs or es6 module without additional configuration;


### 4.2.2 ( 2024-01-20)
- [x] Folder 'dist' is not included in npm package. Folder contains all types of the package - CommonJS, ES6, UMD;
- [x] Build process was added. It's based on "rollup.js";


### 4.2.1 ( 2024-01-02)
- [x] Development dependencies update;


### 4.2.0 ( 2023-09-23)
- [x] Provide collection containers to callbacks. Extract data during iteration;



### 4.1.0 (2023-09-19)
 - [x] HTML DOM nodes - copy by reference; 



### 4.0.0 (2022-11-23)
- [x] Callbacks should return const IGNORE if key-value pear should be ignored;
- [x] `Null` and `undefined` returned from callback functions will be treated as values;



### 3.0.1 (2022-11-15)
- [x] Fix: Breaks if object contains value 'null';



### 3.0.0 ( 2022-09-18 )
- [x] Interface changes - Named arguments.
- [ ] Bug: Breaks if object contains value 'null';



### 2.0.1 ( 2022-07-22)
- [x] Rebuilds an array indexes;
- [ ] Bug: Breaks if object contains value 'null';



### 2.0.0 ( 2022-07-22)
- [x] Object callback has new argument 'key'. Arguments are ( obj, key, breadcrumbs );
- [x] When object-callback returns null the property will disappear;
- [x] If object-callback returns string, object will be substituted with this string;
- [ ] Bug: Breaks if object contains value 'null';



### 1.1.0 (2022-05-23)
- [x] Object callbacks;



### 1.0.2 (2022-03-04)
- [x] Fix: Breadcrumbs in callback are not correct;

### 1.0.0 (2022-03-04)
 - [x] Initial code;
 - [x] Test package;
 - [x] Documentation;
 - [ ] Bug: Breadcrumbs in callback are not correct;


