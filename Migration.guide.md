# Migration Guides


## From v.3.x.x - v.4.x.x
Walk version 4 provides support for all javascript primitive types including `null` and `undefined`.
Untill version 3, callback returns `null` if value should be **ignored**. Walk v.4 provides argument constant `IGNORE`. Return it if need to ignore. Returning of `null` and `undefined` will be treated as standard values. 

```js
//v.3
function someKeyCallback ({value, key, breadcrumbs }) {
            if ( value == 'something' )   return null   // will cancel 
            return value
    }

// v.4
function someKeyCallback ({value, key, breadcrumbs, IGNORE }) {
            if ( value == 'something' )   return IGNORE   // will cancel 
            return value
    }
```

That's all changes needed to move from v.3.x.x to v.4.x.x.




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