function findType ( x ) {
    if ( x == null              )   return 'simple' // null and undefined
    if ( x.nodeType             )   return 'simple' // DOM node
    if ( x instanceof Array     )   return 'array'
    if ( typeof x === 'object'  ) {
        // Built-in object types whose data lives outside the own-enumerable-string-key
        // model that walk uses. Treated as 'simple' so the value is preserved by
        // reference (same contract as functions and DOM nodes).
        if ( x instanceof Date        )   return 'simple'
        if ( x instanceof RegExp      )   return 'simple'
        if ( x instanceof Map         )   return 'simple'
        if ( x instanceof Set         )   return 'simple'
        if ( x instanceof WeakMap     )   return 'simple'
        if ( x instanceof WeakSet     )   return 'simple'
        if ( x instanceof ArrayBuffer )   return 'simple'
        if ( x instanceof DataView    )   return 'simple'
        if ( ArrayBuffer.isView ( x ) )   return 'simple' // Typed arrays (Uint8Array, Float32Array, ...)
        return 'object'
    }
    return 'simple'   // number, bigint, string, boolean, symbol, function
 } // findType func.



 export default findType


 