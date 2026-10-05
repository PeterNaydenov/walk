"use strict"

const instructions = new WeakSet ();


/**
 *  Private instruction created by the FINISH helper.
 *
 *  @typedef {object} FinishInstruction
 *  @property {*} value
 *  @property {boolean} hasValue
 */

/**
 *  Stop the entire walk. Omit the current value when no argument is
 *  supplied. From objectCallback, a supplied value selects the final
 *  branch for key callbacks with isFinished true. From keyCallback,
 *  include the supplied value directly and stop immediately.
 *
 *  @param {*} [value] - Final value or branch.
 *  @returns {FinishInstruction}
 */
function FINISH ( value ) {
    const instruction = Object.freeze ({ value, hasValue:arguments.length > 0 });
    instructions.add ( instruction )
    return instruction
} // FINISH func.



function isFinish ( value ) {
    return instructions.has ( value )
} // isFinish func.



export { isFinish }
export default FINISH
