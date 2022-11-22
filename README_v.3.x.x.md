# Walk (@peter.naydenov/walk) ( Version 3.x.x )

- [Documentation for old v.2.x.x](https://github.com/PeterNaydenov/walk/blob/master/README_v.2.x.x.md)
- [Migration guides](https://github.com/PeterNaydenov/walk/blob/master/Migration.guide.md)

Creates an immutable copies of javascript data structures(objects, arrays or mixed). Executes callback functions on every object property(object-callback) and every primitive property(key-callback). Callbacks can modify result object during the walk process. Mask, filter or substitute values during the copy process. 

```js
const result = walk ({
                            data             // (required) Any JS data structure;
                          , objectCallback   // (optional) Function executed on each object property;
                          , keyCallback      // (optional) Function executed on each primitive property;
                    })
// Result will become a exact deep copy of "data" 
// - if callbacks are not defined
// - if callbacks are resolved with "value" without modification
```

## keyCallback
function "**keyCallback**" of the `walk` could be used also as a deep '**forEach**' method no matter of the type of the object(object or array).

```js
function keyCallbackFn ({value,key,breadcrumbs}) {
    // value: value for the property
    // key:  key of the property
    // breadcrumbs: location of the property
    // Callback should return the value of the property. If function returns 'null' or 'undefined', property will be ignored.
  }

let result = walk ({ data, keyCallback: keyCallbackFn });  // It's the short way to provide only key-callback. Callback functions are optional.
// let result = walk ({ data, keyCallback, objectCallback });  // If both callbacks are available
```


## objectCallback

Optional callback function that is started on each object property. Function should return object or will be ignored in copy process.

```js
function objectCallbackFn ({ value, key, breadcrumbs }) {
      // value: each object during the walk
      // key: key of the object
      // breadcrumbs: location of the object
      // object callback should return an object.
}

let result = walk ({ data, keyCallback:keyCallbackFn, objectCallback : objectCallbackFn })
```

**IMPORTANT: Object-callbacks are executed always before key-callbacks. If we have both callbacks, then key-callbacks will be executed on the result of object-callback.**

Skip key-callbacks by not defining them:
```js
 let result = walk ({ data, objectCallback: objectCallbackFn })   // ignore keyCallback
```


## Installation

Install for node.js projects by writing in your terminal:

```
npm install @peter.naydenov/walk
```

Once it has been installed, it can be used by writing this line of JavaScript:
```js
let walk = require ( '@peter.naydenov/walk' )
```

or

```js
import walk from '@peter.naydenov/walk'
```

**Installation for browsers**: Get the file `"dist/walk.min.js"` and put it inside the project. Request the file from HTML page. Global variable 'walk' is available for use. 

Versions of `walk` after v.3.1.x are buided as ES module, so don't forget to add `type="module"`. 

        Note:
        Library is using 'generator functions'. If support for old browsers 
        is required, add a polyfill for 'generators'.





## How to use it

### Deep copy
```js
let myCopy = walk ({ data:x })   // where x is some javascript data structure
```



### Deep 'forEach'
```js
let x = {
          ls    : [ 1,2,3 ]
        , name  : 'Peter'
        , props : {
                      eyeColor: 'blue'
                    , age     : 47
                    , height  : 176
                    , sizes : [12,33,12,21]
                }
    };

walk ({ data:x, keyCallback : ({value,key, breadcrumbs}) => {
                  console.log (`${key} ----> ${value}`)   // Show each each primitive couples key->value
                  console.log ( `Property location >> ${breadcrumbs}`)
                  // example for breadcrumbs: 'age' will looks like this : 'root/props/age'
              }
    })
```


### Ignore a key

```js
let x = {
          ls    : [ 1,2,3 ]
        , name  : 'Peter'
        , props : {
                      eyeColor: 'blue'
                    , age     : 47
                    , height  : 176
                    , sizes : [12,33,12,21]
                }
    };
let result = walk ({ data:x, keyCallback : ({value,key}) => {
                        if ( key === 'name' )   return null
                        return value
                })
// result will copy all properties from x without the property 'name'.
// result.name === undefined
```


### Mask values

```js
let x = {
          ls    : [ 1,2,3 ]
        , name  : 'Peter'
        , props : {
                      eyeColor: 'blue'
                    , age     : 47
                    , height  : 176
                    , sizes : [12,33,12,21]
                }
    };
let result = walk ({ data:x, keyCallback : () => 'xxx' })
// 'result' will have the same structure as 'x' but all values are 'xxx'
// {
//      ls    : [ 'xxx','xxx','xxx' ]
//    , name  : 'xxx'
//    , props : {
//                  eyeColor: 'xxx'
//                , age     : 'xxx'
//                , height  : 'xxx'
//                , sizes : ['xxx','xxx','xxx','xxx']
//             }
//   } 
```

### Change object on condition

```js
let x = {
          ls    : [ 1,2,3 ]
        , name  : 'Peter'
        , props : {
                      eyeColor: 'blue'
                    , age     : 48
                    , height  : 176
                    , sizes : [12,33,12,21]
                }
    };

function objectCallback ({ value:obj, key, breadcrumbs }) {
    const {age, height} = obj;
    if ( age && age > 30 ) {
            return { age, height }
        }
    return obj
}

let result = walk ({ data:x, objectCallback })
// 'result.props' will have only 'age' and 'height' properties.
// {
//      ls    : [ 1,2,3 ]
//    , name  : 'Peter'
//    , props : {
//                  age     : 48
//                , height  : 176
//             }
//   } 
```

## Limitations
- `walk` keyCallback can return only primitives;
- `walk` can not execute another `walk` from inside of the callbacks;
- It's not recomended to use any async operations in the callbacks. Could compromise the result without any warning;

These limitations are covered in a bit larger library - [walk-async](https://github.com/PeterNaydenov/walk-async). Interface is very simular but result is coming as a promise and callbacks should be resolved or rejected.

## Links
- [Release history](Changelog.md)

## Credits
'@peter.naydenov/walk' was created and supported by Peter Naydenov.

## License
'@peter.naydenov/walk' is released under the MIT License.
