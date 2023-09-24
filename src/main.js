"use strict"

/**
 *     walk
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
 */



import findType    from "./findType.js";
import copyObject from "./copyObject.js";



function walk ({ data:origin, keyCallback, objectCallback },...args) {
    let 
          type = findType ( origin )
        , result
        , extend = []
        , breadcrumbs = 'root'
        , cb = [ keyCallback, objectCallback ]
        ;

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


