export type IgnoreToken = symbol;
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
     * - Slash-delimited path to the current key, starting with `root` (e.g. `"root/props/age"`).
     */
    breadcrumbs: string;
    /**
     * - Return this from the callback to drop the current key from the result.
     */
    IGNORE: IgnoreToken;
};
export type KeyCallback = (args: CallbackArgs, ...rest: any) => any;
export type ObjectCallback = (args: CallbackArgs, ...rest: any) => any;
export type Options = {
    /**
     * - Required. Any JS data structure that will be copied.
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
};
/**
 *  Sentinel value passed to callbacks. Return it from a callback to drop
 *  the current key from the result. A fresh symbol is created on every
 *  callback call, so always return the value that was handed to you.
 *
 *  @typedef {symbol} IgnoreToken
 */
/**
 *  Arguments object received by both `keyCallback` and `objectCallback`.
 *
 *  @typedef {object} CallbackArgs
 *  @property {*}          value        - The current value being processed.
 *  @property {string}     key          - Property key as a string.
 *  @property {string}     breadcrumbs  - Slash-delimited path to the current key, starting with `root` (e.g. `"root/props/age"`).
 *  @property {IgnoreToken} IGNORE      - Return this from the callback to drop the current key from the result.
 */
/**
 *  Called once per primitive property (string, number, bigint, boolean,
 *  symbol, null, undefined, function, Date, RegExp, Map, Set, WeakMap,
 *  WeakSet, ArrayBuffer, DataView, typed arrays, DOM nodes).
 *
 *  Return the new value to store, or `IGNORE` to drop the key:
 *    - return a primitive (or a built-in like `Date`/`Map`/`Set`) → stored as-is by reference;
 *    - return a plain object or array → walk continues into it with the other callback applied to its children;
 *    - return `IGNORE` → that key is dropped from the result.
 *
 *  @callback KeyCallback
 *  @param {CallbackArgs} args
 *  @param {...*}         rest - Any extra arguments passed to `walk()` are forwarded to the callback.
 *  @returns {*}
 */
/**
 *  Called once per object or array property, including the root.
 *  The returned value becomes the new value at that key:
 *    - return an object or array → walk continues into it with the other callbacks;
 *    - return a primitive        → it is stored as the value, no further walking;
 *    - return `IGNORE`           → the key is dropped from the result.
 *
 *  @callback ObjectCallback
 *  @param {CallbackArgs} args
 *  @param {...*}         rest
 *  @returns {*}
 */
/**
 *  @typedef {object} Options
 *  @property {*}             data           - Required. Any JS data structure that will be copied.
 *  @property {KeyCallback}    [keyCallback]    - Optional. Executed on each primitive property.
 *  @property {ObjectCallback} [objectCallback] - Optional. Executed on each object/array property, including the root.
 */
/**
 *  Walk
 *
 *  Creates an immutable copy of a deep JavaScript data structure.
 *  Two optional callbacks run during the walk and can mask, filter, or
 *  substitute values as the result is built.
 *
 *  @function walk
 *  @param {Options} options   - Required. Object with required `data` property and two optional callback functions: `keyCallback` and `objectCallback`.
 *  @param {...*}    args      - Optional. Additional arguments forwarded to both callbacks.
 *  @returns {*}               - Created immutable copy of `options.data`.
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