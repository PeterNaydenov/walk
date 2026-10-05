# Runnable examples

## Contents

- [Remove leaf keys](#remove-leaf-keys)
- [Prune a whole branch](#prune-a-whole-branch)
- [PASS with a replacement](#pass-with-a-replacement)
- [Inspect with a parent path](#inspect-with-a-parent-path)
- [Stop at a matching leaf](#stop-at-a-matching-leaf)
- [Search without copying](#search-without-copying)
- [Process a final branch](#process-a-final-branch)
- [Copy circular and shared references](#copy-circular-and-shared-references)

Each block is independent and uses the version 7 API. Expected results are
shown below the calls. Preserve the developer's style when adapting them.

## Remove leaf keys

```js
import walk from '@peter.naydenov/walk'

let data = { name:'Peter', password:'secret', nested:{ token:'abc', count:2 } };
let result = walk ({
                          data
                        , keyCallback : ({ key, value, IGNORE }) => {
                                              if ( key === 'password' || key === 'token' )   return IGNORE()
                                              return value
                                          }
                    })
// { name:'Peter', nested:{ count:2 } }
// data still contains password and nested.token.
```

## Prune a whole branch

```js
import walk from '@peter.naydenov/walk'

let data = { profile:{ name:'Peter' }, metadata:{ events:[1,2,3] } };
let result = walk ({
                          data
                        , objectCallback : ({ key, value, IGNORE }) => key === 'metadata' ? IGNORE() : value
                    })
// { profile:{ name:'Peter' } }
// Nothing inside metadata is visited.
```

## PASS with a replacement

```js
import walk from '@peter.naydenov/walk'

let data = { branch:{ count:2, nested:{ count:3 } } };
let result = walk ({
                          data
                        , objectCallback : ({ key, value, PASS }) => {
                                              if ( key === 'branch' )   return PASS ({ ...value, count:100 })
                                              return value
                                          }
                        , keyCallback : ({ value }) => typeof value === 'number' ? value * 2 : value
                    })
// { branch:{ count:100, nested:{ count:6 } } }
// PASS() instead keeps branch.count at 2; nested.count still becomes 6.
```

## Inspect with a parent path

```js
import walk from '@peter.naydenov/walk'

let data = { profile:{ age:42 } };
let paths = [];
let result = walk ({
                          data
                        , settings : { copy:false, breadcrumbs:false }
                        , objectCallback : ({ value }) => value
                        , keyCallback : ({ parentPath, key }) => {
                                              paths.push ([ ...parentPath, key ])
                                          }
                    })
// paths: [['root','profile','age']]
// result: undefined
```

## Stop at a matching leaf

```js
import walk from '@peter.naydenov/walk'

let data = [12,22,33,44,55,66];
let result = walk ({
                          data
                        , keyCallback : ({ value, FINISH }) => {
                                              if ( value === 33 )   return FINISH ( value )
                                              return value
                                          }
                    })
// [12,22,33]
// Return FINISH() instead to produce [12,22].
```

## Search without copying

```js
import walk from '@peter.naydenov/walk'

let data = { a:12, nested:{ b:33, c:44 } };
let found;
let result = walk ({
                          data
                        , settings : { copy:false, breadcrumbs:false, parentPath:false }
                        , keyCallback : ({ value, FINISH }) => {
                                              if ( value !== 33 )   return
                                              found = value
                                              return FINISH()
                                          }
                    })
// found: 33
// result: undefined
```

## Process a final branch

```js
import walk from '@peter.naydenov/walk'

let data = { a:12, c:{ internal:44, in1:'bbb', in2:'ccc' }, later:99 };
let result = walk ({
                          data
                        , objectCallback : ({ key, value, FINISH }) => key === 'c' ? FINISH ( value ) : value
                        , keyCallback : ({ key, value, isFinished, IGNORE }) => {
                                              if ( isFinished && key !== 'internal' )   return IGNORE()
                                              return value
                                          }
                    })
// { a:12, c:{ internal:44 } }
// Key callbacks in c receive isFinished:true; later is not visited.
```

To select just the first final leaf and stop, return `FINISH(value)` from
that final key callback. Its order follows `Object.keys`, so select by key
when a particular property is required. Nested containers in the selected
branch still have their leaves visited, without further object callbacks.

## Copy circular and shared references

```js
import walk from '@peter.naydenov/walk'

let shared = { count:1 };
let data = { a:shared, b:shared };
data.self = data

let result = walk ({ data })
// result !== data
// result.self === result
// result.a !== result.b
// result.a and result.b both contain { count:1 }.
```
