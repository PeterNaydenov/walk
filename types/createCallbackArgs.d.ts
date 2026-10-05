import FINISH from "./finish.js";
declare function createCallbackArgs(value: any, key: any, IGNORE: any, breadcrumbs: any, parentPath: any, settings: any): {
    value: any;
    key: any;
    breadcrumbs: any;
    parentPath: any;
    IGNORE: any;
    FINISH: typeof FINISH;
} | {
    value: any;
    key: any;
    breadcrumbs: any;
    IGNORE: any;
    FINISH: typeof FINISH;
    parentPath?: undefined;
} | {
    breadcrumbs?: undefined;
    value: any;
    key: any;
    parentPath: any;
    IGNORE: any;
    FINISH: typeof FINISH;
} | {
    breadcrumbs?: undefined;
    parentPath?: undefined;
    value: any;
    key: any;
    IGNORE: any;
    FINISH: typeof FINISH;
};
export default createCallbackArgs;
//# sourceMappingURL=createCallbackArgs.d.ts.map