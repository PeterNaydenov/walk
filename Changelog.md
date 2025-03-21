# Release History



### 5.0.1 ( 2024-12-14)
- [x] JSDoc definitions added;
- [x] TypeScript generated .d.ts files;
- [x] Some changes in package.json related to build process;



### 5.0.0 ( 2024-11-28)
- [x] Object callback will be triggered on 'root' object as well;



### 4.2.3 ( 2024-01-27)
- [x] Package.json: "exports" section was added. Allows you to use package as commonjs or es6 module without additional configuration;


### 4.2.2 ( 2024-01-20)
- [x] Folder 'dist' is not included in npm package. Folder contains all types of the package - CommonJS, ES6, UMD;
- [x] Build process was added. It's based on "rollup.js";


### 4.2.1 ( 2024-01-02)
- [x] Development dependencies update;


### 4.2.0 ( 2023-09-23)
- [x] Provide collection containers to callbacks. Extract data during iteration;



### 4.1.0 (2023-09-19)
 - [x] HTML DOM nodes - copy by reference; 



### 4.0.0 (2022-11-23)
- [x] Callbacks should return const IGNORE if key-value pear should be ignored;
- [x] `Null` and `undefined` returned from callback functions will be treated as values;



### 3.0.1 (2022-11-15)
- [x] Fix: Breaks if object contains value 'null';



### 3.0.0 ( 2022-09-18 )
- [x] Interface changes - Named arguments.
- [ ] Bug: Breaks if object contains value 'null';



### 2.0.1 ( 2022-07-22)
- [x] Rebuilds an array indexes;
- [ ] Bug: Breaks if object contains value 'null';



### 2.0.0 ( 2022-07-22)
- [x] Object callback has new argument 'key'. Arguments are ( obj, key, breadcrumbs );
- [x] When object-callback returns null the property will disappear;
- [x] If object-callback returns string, object will be substituted with this string;
- [ ] Bug: Breaks if object contains value 'null';



### 1.1.0 (2022-05-23)
- [x] Object callbacks;



### 1.0.2 (2022-03-04)
- [x] Fix: Breadcrumbs in callback are not correct;

### 1.0.0 (2022-03-04)
 - [x] Initial code;
 - [x] Test package;
 - [x] Documentation;
 - [ ] Bug: Breadcrumbs in callback are not correct;


