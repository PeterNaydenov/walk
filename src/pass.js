"use strict"

const instructions = new WeakSet ();


/**
 *  Private instruction created by the PASS helper.
 *
 *  @typedef {object} PassInstruction
 *  @property {*} value
 *  @property {boolean} hasValue
 */

/**
 *  Use the current value, or a supplied replacement, without its
 *  immediate key callbacks. Nested object callbacks continue normally.
 *
 *  @param {*} [value] - Replacement value. Omit to keep the current value.
 *  @returns {PassInstruction}
 */
function PASS ( value ) {
    const instruction = Object.freeze ({ value, hasValue:arguments.length > 0 });
    instructions.add ( instruction )
    return instruction
} // PASS func.



function isPass ( value ) {
    return instructions.has ( value )
} // isPass func.



export { isPass }
export default PASS
