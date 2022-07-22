
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
        resource = obj
      , [ keyCallback, objectCallback ] = callback
      ;

    let keys = Object.keys ( resource );
    keys.forEach ( k => {
                    let 
                          type = findType(resource[k])
                        , item  = resource[k]
                        , resultIsArray = (findType (result) === 'array') 
                        , keyNumber = !isNaN ( k )
                        ;
                    if ( type !== 'simple' && objectCallback ) {
                                        item = objectCallback ( item, k, `${breadcrumbs}/${k}` )
                                        if ( item == null )   return
                                        type = findType ( item )
                       }

                    if ( type === 'simple' ) {
                                    if ( !keyCallback ) {  
                                            result[k] = item
                                            return
                                        }
                                    let keyRes = keyCallback ( item, k, `${breadcrumbs}/${k}`);
                                    if ( keyRes == null )   return
                                    result[k] = keyRes
                        }
                    if ( type === 'object' ) {
                            const newObject = {};
                            if ( resultIsArray && keyNumber )   result.push ( newObject )
                            else                                result[k] = newObject
                            extend.push ( generateList ( newObject, item, extend, callback, `${breadcrumbs}/${k}` )   )
                       }
                    if ( type === 'array' ) {
                            const newArray = [];
                            if ( resultIsArray && keyNumber )   result.push ( newArray )
                            else                                result[k] = newArray
                            extend.push ( generateList( newArray, item, extend, callback, `${breadcrumbs}/${k}` )   )
                        }
            })
} // copyObject func.



module.exports = walk


