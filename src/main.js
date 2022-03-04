
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
 *
 */


 function walk ( origin, callback ) {
    let 
          type = findType ( origin )
        , result
        , extend = []
        , breadcrumbs = 'root'
        ;
    switch ( type ) {
            case 'array'  :
                                result = []
                                copyObject ( origin, result, extend, callback, breadcrumbs )
                                break
            case 'object' :
                                result = {}
                                copyObject ( origin, result, extend, callback, breadcrumbs )
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



function copyObject ( obj, result, extend, callback, breadcrumbs ) {
    let keys = Object.keys ( obj );
    keys.forEach ( k => {
                    const type = findType(obj[k]);
                    if ( type === 'simple' ) {
                                    if ( !callback ) {  
                                            result[k] = obj[k]
                                            return
                                        }
                                    let res = callback ( obj[k], k, `${breadcrumbs}/k`);
                                    if ( res == null )   return
                                    result[k] = res
                        }
                    if ( type === 'object' ) {
                            result[k] = {}
                            extend.push ( generateList ( result[k], obj[k], extend, callback, `${breadcrumbs}/${k}` )   )
                       }
                    if ( type === 'array' ) {
                            result[k] = []
                            extend.push ( generateList( result[k], obj[k], extend, callback, `${breadcrumbs}/${k}` )   )
                        }
            })
} // copyObj func.



module.exports = walk


