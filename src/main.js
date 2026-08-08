"use strict"

/**
 *     Walk
 * 
 *     Alternative of deep-copy that provides much better control during creation of immutable 
 *     copies of javascript data structures. 
 *     Library is using 'generator functions'. If support for old browsers is required, 
 *     add a polyfill for 'generators'.
 * 
 *     History notes:
 *        - Development started on March 2nd, 2022
 *        - Published on GitHub for first time: March 4th, 2022
 *        - Object callback. May 23th, 2022
 *        - Interface changes - Named arguments. September 18th, 2022
 *        - Version 5. Object callback with 'root' object. November 28th, 2024
 */



import findType    from "./findType.js";
import copyObject from "./copyObject.js";


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
function walk (options,...args) {
    let
          { data:origin, keyCallback, objectCallback } = options
        , type = findType ( origin )
        , result
        , extend = []
        , breadcrumbs = 'root'
        , cb = [ keyCallback, objectCallback ]
        ;

    if ( type !== 'simple' && objectCallback ) {   // Root object callback. Executed before the result is allocated, so it can replace the root with anything.
            const IGNORE = Symbol ( 'ignore___' )
            const replacement = objectCallback ({ value:origin, key:'root', breadcrumbs, IGNORE }, ...args )
            if ( replacement === IGNORE )   return ( type === 'array' ) ? [] : {}
            origin = replacement
            type = findType ( origin )
        }

    switch ( type ) {
            case 'array'  :
                                result = []
                                copyObject ( origin, result, extend, cb, breadcrumbs, ...args )
                                break
            case 'object' :
                                result = {}
                                copyObject ( origin, result, extend, cb, breadcrumbs, ...args )
                                break
            case 'simple' :
                                return origin
        } // switch type

    for ( const plus of extend ) {   plus.next() }
    return result
} // walk func.



export default walk


