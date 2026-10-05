"use strict"

const instruction = Symbol ( 'ignore___' );


/**
 *  Remove the current key or the entire current object/array branch.
 *
 *  @returns {symbol}
 */
function IGNORE () {
    return instruction
} // IGNORE func.



function isIgnore ( value ) {
    return value === instruction
} // isIgnore func.



export { isIgnore }
export default IGNORE
