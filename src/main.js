
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


 function walk ({ data:origin, keyCallback, objectCallback }) {
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



function validateForInsertion ( k, result ) {
    const inArray = result instanceof Array;
    if ( !inArray )   return false
    const isNumber = !isNaN ( k );
    if ( isNumber )   return true
    else              return false
} // validateForInsertion func.



function* generateList ( data, location, ex, callback, breadcrumbs ) {
    yield copyObject ( data , location, ex, callback, breadcrumbs )  
} // generateList func.



function copyObject ( resource, result, extend, cb, breadcrumbs ) {
    let 
          [ keyCallback, objectCallback ] = cb
        , keys = Object.keys ( resource )
        ;
    keys.forEach ( k => {
                    let 
                          type = findType(resource[k])
                        , item  = resource[k]
                        , resultIsArray = (findType (result) === 'array') 
                        , keyNumber = !isNaN ( k )
                        ;
                    if ( type !== 'simple' && objectCallback ) {
                                        item = objectCallback ({ value:item, key:k, breadcrumbs: `${breadcrumbs}/${k}` })
                                        if ( item == null )   return
                                        type = findType ( item )
                        }

                    if ( type === 'simple' ) {
                                    if ( !keyCallback ) {  
                                            result[k] = item
                                            return
                                        }
                                    let keyRes = keyCallback ({ value:item, key:k, breadcrumbs: `${breadcrumbs}/${k}`});
                                    if ( keyRes == null )   return
                                    const canInsert = validateForInsertion ( k, result );
                                    if ( canInsert )  result.push ( keyRes )
                                    else              result [k] = keyRes
                        }
                    if ( type === 'object' ) {
                            const newObject = {};
                            if ( resultIsArray && keyNumber )   result.push ( newObject )
                            else                                result[k] = newObject
                            extend.push ( generateList ( item, newObject,  extend, cb, `${breadcrumbs}/${k}` )   )
                       }
                    if ( type === 'array' ) {
                            const newArray = [];
                            if ( resultIsArray && keyNumber )   result.push ( newArray )
                            else                                result[k] = newArray
                            extend.push ( generateList( item, newArray, extend, cb, `${breadcrumbs}/${k}` )   )
                        }
            })
} // copyObject func.



module.exports = walk


