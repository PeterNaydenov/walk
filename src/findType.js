function findType ( x ) {
    if ( x == null              )   return 'simple'
    if ( typeof x === 'boolean' )   return 'simple'
    if ( x instanceof Array     )   return 'array'
    if ( typeof x === 'object'  )   return 'object'
    return 'simple'
 } // findType func.



 export default findType


 