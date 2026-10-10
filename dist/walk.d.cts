import type walkFunction from '../types/main.js';

declare const walk: typeof walkFunction;

declare namespace walk {
    type IgnoreToken = import('../types/main.js').IgnoreToken;
    type IgnoreFunction = import('../types/main.js').IgnoreFunction;
    type PassFunction = import('../types/main.js').PassFunction;
    type FinishFunction = import('../types/main.js').FinishFunction;
    type CallbackArgs = import('../types/main.js').CallbackArgs;
    type KeyCallbackArgs = import('../types/main.js').KeyCallbackArgs;
    type ObjectCallbackArgs = import('../types/main.js').ObjectCallbackArgs;
    type KeyCallback = import('../types/main.js').KeyCallback;
    type ObjectCallback = import('../types/main.js').ObjectCallback;
    type Settings = import('../types/main.js').Settings;
    type Options = import('../types/main.js').Options;
}

export = walk;
