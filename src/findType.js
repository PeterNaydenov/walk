function findType ( x ) {
    if ( x == null              )   return 'simple' // null and undefined
    if ( x instanceof Array      )   return 'array'
    if ( typeof x === 'object'  )   return 'object'
    return 'simple'   // number, bigint, string, boolean, symbol, function 
 } // findType func.



 export default findType


 