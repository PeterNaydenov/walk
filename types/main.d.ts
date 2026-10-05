export type IgnoreToken = symbol;
export type IgnoreFunction = () => IgnoreToken;
export type PassFunction = (value?: any) => import('./pass.js').PassInstruction;
export type FinishFunction = (value?: any) => import('./finish.js').FinishInstruction;
export type CallbackArgs = {
    /**
     * - The current value being processed.
     */
    value: any;
    /**
     * - Property key as a string.
     */
    key: string;
    /**
     * - Slash-delimited path including the current key. Absent when `settings.breadcrumbs` is false.
     */
    breadcrumbs?: string;
    /**
     * - Read-only path to the parent, excluding the current key. Absent when `settings.parentPath` is false.
     */
    parentPath?: ReadonlyArray<string>;
    /**
     * - Return IGNORE() from the callback to drop the current key from the result.
     */
    IGNORE: IgnoreFunction;
    /**
     * - Return FINISH() to omit the current value and stop, or FINISH(value) to select a final value.
     */
    FINISH: FinishFunction;
};
export type KeyCallbackArgs = CallbackArgs & {
    isFinished: boolean;
};
export type ObjectCallbackArgs = CallbackArgs & {
    PASS: PassFunction;
};
export type KeyCallback = (args: KeyCallbackArgs, ...rest: any) => any;
export type ObjectCallback = (args: ObjectCallbackArgs, ...rest: any) => any;
export type Settings = {
    /**
     * - Defaults to true. Only false disables result creation; callbacks still run and walk returns undefined.
     */
    copy?: boolean;
    /**
     * - Defaults to true. Only false disables breadcrumbs preparation.
     */
    breadcrumbs?: boolean;
    /**
     * - Defaults to true. Only false disables parent-path preparation.
     */
    parentPath?: boolean;
    /**
     * - Defaults to true. Only false disables circular-reference checks and their bookkeeping; visited data and replacements must then be acyclic or callbacks must prune cyclic branches.
     */
    detectCycles?: boolean;
};
export type Options = {
    /**
     * - Required. Any JS data structure that will be walked.
     */
    data: any;
    /**
     * - Optional. Executed on each primitive property.
     */
    keyCallback?: KeyCallback;
    /**
     * - Optional. Executed on each object/array property, including the root.
     */
    objectCallback?: ObjectCallback;
    /**
     * - Optional. Disable copying, unused callback metadata, or cycle detection with false.
     */
    settings?: Settings;
};
/**
 *  Private sentinel returned by IGNORE().
 *
 *  @typedef {symbol} IgnoreToken
 */
/**
 *  Call and return the result to drop the current key or entire branch.
 *
 *  @callback IgnoreFunction
 *  @returns {IgnoreToken}
 */
/**
 *  Call with no arguments to keep the current value, or pass a replacement.
 *  Return the instruction from `objectCallback` to skip `keyCallback` on
 *  its immediate properties. Nested objects and arrays continue normally.
 *
 *  @callback PassFunction
 *  @param {*} [value]
 *  @returns {import('./pass.js').PassInstruction}
 */
/**
 *  Call and return the instruction to stop the entire walk.
 *  With no argument, omit the current value. From objectCallback, a
 *  supplied value is the final branch: key callbacks run with isFinished
 *  true, without further object callbacks. From keyCallback, include the
 *  supplied value directly and stop immediately.
 *
 *  @callback FinishFunction
 *  @param {*} [value]
 *  @returns {import('./finish.js').FinishInstruction}
 */
/**
 *  Shared arguments received by `keyCallback` and `objectCallback`.
 *
 *  @typedef {object} CallbackArgs
 *  @property {*}          value        - The current value being processed.
 *  @property {string}     key          - Property key as a string.
 *  @property {string}     [breadcrumbs] - Slash-delimited path including the current key. Absent when `settings.breadcrumbs` is false.
 *  @property {ReadonlyArray<string>} [parentPath] - Read-only path to the parent, excluding the current key. Absent when `settings.parentPath` is false.
 *  @property {IgnoreFunction} IGNORE   - Return IGNORE() from the callback to drop the current key from the result.
 *  @property {FinishFunction} FINISH   - Return FINISH() to omit the current value and stop, or FINISH(value) to select a final value.
 */
/**
 *  @typedef {CallbackArgs & { isFinished: boolean }} KeyCallbackArgs
 */
/**
 *  @typedef {CallbackArgs & { PASS: PassFunction }} ObjectCallbackArgs
 */
/**
 *  Called once per primitive property unless its immediate parent returns
 *  `PASS()` or `PASS(value)` from `objectCallback`. A selected final branch
 *  runs its key callbacks with isFinished true regardless of earlier PASS.
 *  Types: string, number, bigint, boolean,
 *  symbol, null, undefined, function, Date, RegExp, Map, Set, WeakMap,
 *  WeakSet, ArrayBuffer, DataView, typed arrays, DOM nodes.
 *
 *  Return the new value to store, or `IGNORE()` to drop the key:
 *    - return a primitive (or a built-in like `Date`/`Map`/`Set`) → stored as-is by reference;
 *    - return a plain object or array → walk continues into it with the other callback applied to its children;
 *    - return `IGNORE()` → that key is dropped from the result.
 *    - return `FINISH()` → omit the current value and stop the entire walk;
 *    - return `FINISH(value)` → store the supplied value directly and stop, without visiting its contents.
 *  With settings.copy false, no values are stored; returned containers
 *  still control what gets visited.
 *
 *  @callback KeyCallback
 *  @param {KeyCallbackArgs} args - isFinished is true while processing the final branch selected by objectCallback; otherwise false.
 *  @param {...*}         rest - Any extra arguments passed to `walk()` are forwarded to the callback.
 *  @returns {*}
 */
/**
 *  Called once per object or array property, including the root, during
 *  ordinary traversal. No further object callbacks run in a selected final branch.
 *  The returned value becomes the new value at that key:
 *    - return an object or array → walk continues into it with the other callbacks;
 *    - return a primitive        → passed to `keyCallback` when active, otherwise stored as-is;
 *    - return `IGNORE()`         → the key is dropped from the result.
 *    - return `PASS()`           → keep the current object/array without its immediate key callbacks; nested callbacks continue normally.
 *    - return `PASS(value)`      → use the replacement with the same rule; simple replacements are stored directly.
 *    - return `FINISH()`         → omit the current branch and stop the entire walk.
 *    - return `FINISH(value)`    → process only this final branch with keyCallback and isFinished true, then stop. Without keyCallback, include the value directly.
 *  With settings.copy false, returned values control traversal without
 *  being stored in a result or assigned to the source.
 *
 *  @callback ObjectCallback
 *  @param {ObjectCallbackArgs} args
 *  @param {...*}         rest
 *  @returns {*}
 */
/**
 *  @typedef {object} Settings
 *  @property {boolean} [copy]        - Defaults to true. Only false disables result creation; callbacks still run and walk returns undefined.
 *  @property {boolean} [breadcrumbs] - Defaults to true. Only false disables breadcrumbs preparation.
 *  @property {boolean} [parentPath]  - Defaults to true. Only false disables parent-path preparation.
 *  @property {boolean} [detectCycles] - Defaults to true. Only false disables circular-reference checks and their bookkeeping; visited data and replacements must then be acyclic or callbacks must prune cyclic branches.
 */
/**
 *  @typedef {object} Options
 *  @property {*}             data           - Required. Any JS data structure that will be walked.
 *  @property {KeyCallback}    [keyCallback]    - Optional. Executed on each primitive property.
 *  @property {ObjectCallback} [objectCallback] - Optional. Executed on each object/array property, including the root.
 *  @property {Settings}       [settings]       - Optional. Disable copying, unused callback metadata, or cycle detection with false.
 */
/**
 *  Walk
 *
 *  Walks through a deep JavaScript data structure, building a copy by default.
 *  Two optional callbacks can mask, filter, substitute, or collect values.
 *  Set settings.copy to false to walk without building a result.
 *  By default, circular references point to the ancestor copy without visiting its contents again.
 *  Return FINISH() or FINISH(value) from either callback to stop early.
 *  When copying, the result contains only work completed before stopping.
 *
 *  @function walk
 *  @param {Options} options   - Required. Object with `data`, optional callbacks, and optional `settings`.
 *  @param {...*}    args      - Optional. Additional arguments forwarded to both callbacks.
 *  @returns {*}               - Created result, or undefined when settings.copy is false.
 *  @example
 *  let result = walk ({
 *      data: someData,
 *      keyCallback:    keyCallbackFn,
 *      objectCallback: objectCallbackFn
 *  })
 *
 *  // Note: objectCallback is executed before keyCallback.
 *  // If you modify an object with objectCallback, keyCallback will be
 *  // executed on the result of objectCallback.
 */
declare function walk(options: Options, ...args: any[]): any;
export default walk;
//# sourceMappingURL=main.d.ts.map