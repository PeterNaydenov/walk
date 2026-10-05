export type PassInstruction = {
    value: any;
    hasValue: boolean;
};
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
declare function PASS(value?: any): PassInstruction;
declare function isPass(value: any): boolean;
export { isPass };
export default PASS;
//# sourceMappingURL=pass.d.ts.map