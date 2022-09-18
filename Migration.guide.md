# Migration Guides

## From v.2.x.x. - v.3.x.x
Major changes are related to moving from multiple arguments to named arguments.

```js
const someData = { a: 12, b: ['one', 'two'] }
// old:
const result = walk ( someData )
// new:
const result = walk ({ data: someData })
```

Calling `walk` with keyCallback
```js
// old
// - first version:
const result = walk ( someData, keyCallbackFn ) 
// - second version:
const result = walk ( someData, [keyCallbackFn,null])

// new:
const result = walk ({ data:someData, keyCallback: keyCallbackFn })
```

Calling `walk` with both callbacks:
```js
//old:
const result = walk ( someData, [keyCallbackFn, objectCallbackFn])
// new:
const result = walk ({ 
                          data:someData
                        , keyCallback:keyCallbackFn
                        , objectCallback:objectCallbackFn 
                    })
```

Definition for objectCallbacks:
```js
// old
function callback ( obj, key, breadcrumbs ) {
        //... some actions
    }

// new
function callback ({ value, key, breadcrumbs }) {
        //... some actions
    }
```

Definition for keyCallbacks:
```js
// old
function callback (value,key,breadcrumbs) {
         //... some actions
    }


function callback ({value,key,breadcrumbs}) {
         //... some actions
    }
```