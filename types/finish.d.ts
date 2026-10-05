export type FinishInstruction = {
    value: any;
    hasValue: boolean;
};
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
declare function FINISH(value?: any): FinishInstruction;
declare function isFinish(value: any): boolean;
export { isFinish };
export default FINISH;
//# sourceMappingURL=finish.d.ts.map