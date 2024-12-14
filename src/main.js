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
 *  @typedef {object} Options
 *  @property {any} data - Required. Any JS data structure that will be copied.
 *  @property {function} [keyCallback] - Optional. Function executed on each primitive property.
 *  @property {function} [objectCallback] - Optional. Function executed on each object property.
 */


/**
 *  Walk
 * 
 *  Creates an immutable copies of deep javascript data structures. 
 *  Executes callback functions on every object/array property(objectCallback) and every primitive property(keyCallback). 
 *  Callbacks can modify result-object by masking, filter or substitute values during the copy process.
 *  
 *  @function walk
 *  @param {Options} options   - Required. Object with required 'data' property and two optional callback functions: keyCallback and objectCallback. 
 *  @param {...any} args - Optional. Additional arguments that could be used in the callback functions.
 *  @returns {any} - Created immutable copy of the 'options.data' property.
 *  @example
 *  // keyCallbackFn - function executed on each primitive property
 *  // objectCallbackFn - function executed on each object property
 *  let result = walk ({ data:x, keyCallback:keyCallbackFn, objectCallback : objectCallbackFn })
 * 
 * 
 *  // NOTE: objectCallback is executed before keyCallback! 
 *  // If you modify object with objectCallback, then keyCallback 
 *  // will be executed on the result of objectCallback
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

    switch ( type ) {
            case 'array'  :
                                result = []
                                copyObject ( {root:origin}, result, extend, cb, breadcrumbs, ...args )
                                break
            case 'object' :
                                result = {}
                                copyObject ( {root:origin}, result, extend, cb, breadcrumbs, ...args )
                                break
            case 'simple' :
                                return origin
        } // switch type
        
    for ( const plus of extend ) {   plus.next() }
    return result
} // walk func.



export default walk


