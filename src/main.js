
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
 */


 function walk ( origin, callback ) {
    let 
          type = findType ( origin )
        , result
        , extend = []
        , breadcrumbs = 'root'
        , cb = readCallback ( callback )
        ;
    switch ( type ) {
            case 'array'  :
                                result = []
                                copyObject ( origin, result, extend, cb, breadcrumbs )
                                break
            case 'object' :
                                result = {}
                                copyObject ( origin, result, extend, cb, breadcrumbs )
                                break
            case 'simple' :
                                return origin
        } // switch type
    for ( const plus of extend ) {   plus.next() }
    return result
} // walk func.



function findType ( x ) {
    if ( x instanceof Array            ) return 'array'
    if ( typeof x === 'object'         ) return 'object'
    return 'simple'
 } // findType func.



function* generateList ( location, data, ex, callback, breadcrumbs ) {
    yield copyObject ( data , location, ex, callback, breadcrumbs )  
} // generateList func.



function readCallback ( callback ) {
    let 
          keyCallback = null
        , objectCallback = null
        ;
    if ( typeof callback === 'function' )   keyCallback = callback
    else if ( callback instanceof Array ) {
                keyCallback = callback[0]
                objectCallback = callback[1]
        }
    return [ keyCallback, objectCallback ]
} // readCallback func.



function copyObject ( obj, result, extend, callback, breadcrumbs ) {
    let 
        resource
      ,[ keyCallback, objectCallback ] = callback
      ;

    if ( objectCallback )    resource = objectCallback ( obj,  breadcrumbs )
    else                     resource = obj

    if ( resource == null )   return
    if ( findType(resource) == 'simple' ) {
                    const resType = findType(result)
                    if  ( resType == 'array' )   result.push ( resource )
                    else                         result[ resource ] = resource
                    return
        }


    let keys = Object.keys ( resource );
    keys.forEach ( k => {
                    const type = findType(resource[k]);
                    if ( type === 'simple' ) {
                                    if ( !keyCallback ) {  
                                            result[k] = resource[k]
                                            return
                                        }
                                    let keyRes = keyCallback ( resource[k], k, `${breadcrumbs}/${k}`);
                                    if ( keyRes == null )   return
                                    result[k] = keyRes
                        }
                    if ( type === 'object' ) {
                            result[k] = {}
                            extend.push ( generateList ( result[k], resource[k], extend, callback, `${breadcrumbs}/${k}` )   )
                       }
                    if ( type === 'array' ) {
                            result[k] = []
                            extend.push ( generateList( result[k], resource[k], extend, callback, `${breadcrumbs}/${k}` )   )
                        }
            })
} // copyObject func.



module.exports = walk


