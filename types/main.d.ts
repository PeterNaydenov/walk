export default walk;
export type Options = {
    /**
     * - Required. Any JS data structure that will be copied.
     */
    data: any;
    /**
     * - Optional. Function executed on each primitive property.
     */
    keyCallback?: Function;
    /**
     * - Optional. Function executed on each object property.
     */
    objectCallback?: Function;
};
/**
 *  @typedef {object} Options
 *  @property {any} data - Required. Any JS data structure that will be copied.
 *  @property {function} [keyCallback] - Optional. Function executed on each primitive property.
 *  @property {function} [objectCallback] - Optional. Function executed on each object property.
 */
/**
 *  Walk
 *
 *  Creates an immutable copies of deep javascript data structures.
 *  Executes callback functions on every object/array property(objectCallback) and every primitive property(keyCallback).
 *  Callbacks can modify result-object by masking, filter or substitute values during the copy process.
 *
 *  @function walk
 *  @param {Options} options   - Required. Object with required 'data' property and two optional callback functions: keyCallback and objectCallback.
 *  @param {...any} args - Optional. Additional arguments that could be used in the callback functions.
 *  @returns {any} - Created immutable copy of the 'options.data' property.
 *  @example
 *  // keyCallbackFn - function executed on each primitive property
 *  // objectCallbackFn - function executed on each object property
 *  let result = walk ({ data:x, keyCallback:keyCallbackFn, objectCallback : objectCallbackFn })
 *
 *
 *  // NOTE: objectCallback is executed before keyCallback!
 *  // If you modify object with objectCallback, then keyCallback
 *  // will be executed on the result of objectCallback
 */
declare function walk(options: Options, ...args: any[]): any;
//# sourceMappingURL=main.d.ts.map