// Plain assignment of a '__proto__' key triggers the inherited setter and
// replaces the prototype of 'target' instead of creating an own property.
function setKey ( target, k, value ) {
    if ( k === '__proto__' )   Object.defineProperty ( target, k, { value, enumerable:true, writable:true, configurable:true })
    else                       target[k] = value
} // setKey func.



export default setKey


