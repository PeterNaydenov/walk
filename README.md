# Walk (@peter.naydenov/walk)

Creates an immutable copies of javascript data structures(objects, arrays or mixed). There is a fine control during the copy process by triggering a callback function on every object property as an option. Mask, filter or substitute values during the copy process. 

Callback function of the `walk` could be used also as a deep '**forEach**' method no matter of the type of the object(object or array).



```js
function callback (value,key,breadcrumbs) {
    // value: value for the property
    // key:  key of the property
    // breadcrumbs: location of the property
    // Callback should return the value of the property. If function returns 'null' or 'undefined', property will be ignored.
  }

let result = walk ( data, callback );  // Callback function is optional!

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

**Installation for browsers**: Get file `"dist/walk.min.js"` and put it inside the project. Request the file from HTML page. Global variable 'walk' is available for use.

        Note:
        Library is using 'generator functions'. If support for old browsers 
        is required, add a polyfill for 'generators'.





## How to use it

### Deep copy
```js
let myCopy = walk ( x )   // where x is some javascript data structure
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

walk ( x, (value,key, breadcrumbs ) => {
                console.log (`${key} ----> ${value}`)   // Show each each primitive couples key->value
                console.log ( `Property location >> ${breadcrumbs}`)
                // example for breadcrumbs: 'age' will looks like this : 'root/props/age'
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
let result = walk ( x, (value,key) => {
                        if ( key === 'name' )   return null
                        return value
                })
// result will copy all properties from x without the property 'name'.
// result.name === undefined
```


# Mask values

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
let result = walk ( x, v => 'xxx' )
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





## Links
- [Release history](Changelog.md)

## Credits
'@peter.naydenov/walk' was created and supported by Peter Naydenov.

## License
'@peter.naydenov/walk' is released under the MIT License.
