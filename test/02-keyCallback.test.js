"use strict"

import { describe, it, expect } from 'vitest'
import walk from '../src/main.js'



describe ( 'Walk: keyCallback', () => {

    it ( 'Hide a property', () => {
                let
                    x = {
                              ls   : [ 1,2,3 ]
                            , name : 'Peter'
                            , props : {
                                          eyeColor: 'blue'
                                        , age     : 47
                                        , height  : 176
                                        , sizes : [12,33,12,21]
                                    }
                            }
                  , r = walk ({
                                  data : x
                                , keyCallback : ({ value:v, key:k, IGNORE }) => {
                                                      if ( k === 'name' )   return IGNORE
                                                      return v
                                                  }
                          })
                  ;
              expect ( r ).not.toHaveProperty ( 'name' )
       })  // it Hide a property



    it ( 'Provide a structure. Hide values approaches', () => {
                let
                    x = {
                              ls   : [ 1,2,3 ]
                            , name : 'Peter'
                            , props : {
                                          eyeColor: 'blue'
                                        , age     : 47
                                        , height  : 176
                                        , sizes : [12,33,12,21]
                                    }
                            };
                let r = walk ({
                                  data : x
                                , keyCallback : ({value:v,key:k,breadcrumbs, IGNORE }) => {
                                                        if ( breadcrumbs.includes('root/props/sizes'))   return IGNORE
                                                        return 'xxx'
                                                    }
                          })
                expect ( r.name       ).toBe ( 'xxx' )
                expect ( r.props.age  ).toBe ( 'xxx' )
                expect ( r.props.sizes.length ).toBe ( 0 )
      })   // it Provide a structure



    it ( 'No properties. Just structures', () => {
                  let
                    x = {
                              ls   : [ 1,2,3 ]
                            , name : 'Peter'
                            , props : {
                                          eyeColor: 'blue'
                                        , age     : 47
                                        , height  : 176
                                        , sizes : [12,33,12,21]
                                    }
                            };
                  let r = walk ({ data:x, keyCallback: ({IGNORE}) => IGNORE })
                  expect ( r ).toHaveProperty ( 'ls' )
                  expect ( r ).toHaveProperty ( 'props' )
                  expect ( r.props ).toHaveProperty ( 'sizes' )

                  expect ( r       ).not.toHaveProperty ( 'name' )
                  expect ( r.props ).not.toHaveProperty ( 'age' )

                  expect ( r.ls.length ).toBe  ( 0 )
                  expect ( r.props.sizes.length ).toBe ( 0 )
      }) // it No properties



    it ( 'Set a value to NULL', () => {
                let
                    x = {
                              ls   : [ 1,2,3 ]
                            , name : 'Peter'
                            , props : {
                                          eyeColor: null   // Use callback and return this exact value
                                        , age     : 47
                                        , height  : 176
                                        , sizes : [12,33,12,21]
                                    }
                            };

                function checkNull ({ value }) {
                            return value
                    } // checkNull func.

                let r  = walk ({ data:x, keyCallback:checkNull })
                expect ( r.props.eyeColor ).toBe ( null )
      }) // it set a value to NULL



    it ( 'Set a value to undefined', () => {
                 let
                    x = {
                              ls   : [ 1,2,3 ]
                            , name : 'Peter'
                            , props : {
                                          eyeColor: undefined   // Use callback and return this exact value
                                        , age     : 47
                                        , height  : 176
                                        , sizes : [12,33,12,21]
                                    }
                            };

                function checkNull ({ value }) {
                            return value
                    } // checkNull func.

                let r  = walk ({ data:x, keyCallback:checkNull })
                expect ( r.props.eyeColor ).toBe ( undefined )
      }) // it Set a value to undefined



    it ( 'Copy a function', () => {
                 let
                    x = {
                              ls   : [ 1,2,3 ]
                            , name : 'Peter'
                            , props : {
                                          eyeColor: undefined   // Use callback and return this exact value
                                        , age     : function age () { return 47 }
                                        , height  : 176
                                        , sizes : [12,33,12,21]
                                    }
                            };

                function checkNull ({ value }) {
                            return value
                    } // checkNull func.

                let r  = walk ({ data:x, keyCallback:checkNull })
                expect ( r.props.age() ).toBe ( 47 )
      }) // it Copy a function



   it ( 'Extract collections', () => {
                let
                    x = {
                              ls   : [ 1,2,3 ]
                            , name : 'Peter'
                            , props : {
                                          eyeColor: undefined   // Use callback and return this exact value
                                        , age     : function age () { return 47 }
                                        , height  : 176
                                        , sizes : [12,33,12,21]
                                    }
                            }
                    , fnList = []           // collection containers should be object or array
                    , propsCollection = {}  // because
                    ;

                function extractFn ({key,value}, fn, p ) { // fn and p are collections containers
                            const isFn = typeof value === 'function';
                            if ( isFn )   fn.push ( value ) // Create a list of function properties;
                            // v--- extract 3 properties from the object. No matter where they are
                            if ( ['name','eyeColor', 'age' ].includes(key) )  p[key] = isFn? value() : value
                            return value
                        } // extractFn func.

                let r = walk ({ data:x, keyCallback:extractFn }, fnList, propsCollection ); // Provide a collection containers

                expect ( fnList ).toHaveLength ( 1 ) // There is only one function in the object
                expect ( fnList[0]() ).toBe ( 47 )
                expect ( propsCollection ).toHaveProperty ( 'name' )
                expect ( propsCollection ).toHaveProperty ( 'eyeColor' )
                expect ( propsCollection ).toHaveProperty ( 'age' )
                expect ( propsCollection ).not.toHaveProperty ( 'height' )
                expect ( propsCollection.age ).toBe ( 47 )
                expect ( r.props.age() ).toBe ( 47 )
      }) // it  Extract collections



    // -------------------------------------------------------------------------
    // keyCallback returning a plain object/array:
    // The returned value is re-typed and, if it's a plain object or array, walk
    // continues into it with the other callback. Built-in types (Date, Map,
    // Set, typed arrays, etc.) are still 'simple' and are stored by reference
    // with no descent.
    // -------------------------------------------------------------------------

    it ( 'keyCallback returning a plain object is walked into (keyCallback fires on its primitives)', () => {
                const x = { name: 'Peter', age: 47 }
                const seen = []
                const r = walk ({
                          data: x
                        , keyCallback: ({ value, key }) => {
                                              seen.push ( `${key}=${value}` )
                                              if ( key === 'name' )   return { wrapped: { inner: 'newValue' } }
                                              return value
                                          }
                    })
                expect ( r.name ).not.toBe ( 'Peter' )
                expect ( r.name.wrapped.inner ).toBe ( 'newValue' )   // walked into
                expect ( seen ).toContain ( 'inner=newValue' )          // keyCallback fired on the new structure
      }) // it keyCallback returning a plain object


    it ( 'keyCallback returning a plain object fires objectCallback on the new structure', () => {
                const x = { name: 'Peter' }
                const objCbKeys = []
                walk ({
                          data: x
                        , objectCallback: ({ value, key }) => {
                                              if ( key !== 'root' )   objCbKeys.push ( key )
                                              return value            // pass-through
                                          }
                        , keyCallback: ({ key, value }) => {
                                              if ( key === 'name' )   return { wrapped: { inner: 'x' } }
                                              return value
                                          }
                    })
                // The substituted structure was walked: objectCallback fired for its object key 'wrapped'
                expect ( objCbKeys ).toContain ( 'wrapped' )
      }) // it keyCallback returning object + objectCallback


    it ( 'keyCallback returning an array is walked into', () => {
                const x = { items: 'placeholder' }
                const r = walk ({
                          data: x
                        , keyCallback: ({ key, value }) => key === 'items' ? [ 1, 2, 3 ] : value
                    })
                expect ( Array.isArray ( r.items ) ).toBe ( true )
                expect ( r.items ).toEqual ( [ 1, 2, 3 ] )
      }) // it keyCallback returning an array


    it ( 'keyCallback returning a built-in (Date) is passed by reference, not walked', () => {
                const d = new Date ( '2024-01-15' )
                const x = { when: 'placeholder' }
                let objectCbDescents = 0
                const r = walk ({
                          data: x
                        , objectCallback: ({ value, key }) => {
                                              if ( key === 'when' )   objectCbDescents++
                                              return value
                                          }
                        , keyCallback: ({ key, value }) => key === 'when' ? d : value
                    })
                expect ( r.when ).toBe ( d )             // same reference, not a copy
                expect ( objectCbDescents ).toBe ( 0 )   // objectCallback never fired on the Date
      }) // it keyCallback returning a Date


    it ( 'keyCallback returning a Map is passed by reference, not walked', () => {
                const m = new Map ([ [ 'a', 1 ], [ 'b', 2 ] ])
                const x = { scores: 'placeholder' }
                const r = walk ({
                          data: x
                        , keyCallback: ({ key, value }) => key === 'scores' ? m : value
                    })
                expect ( r.scores ).toBe ( m )                      // same reference
                expect ( r.scores.get ( 'a' ) ).toBe ( 1 )         // still functional
                expect ( r.scores.get ( 'b' ) ).toBe ( 2 )
      }) // it keyCallback returning a Map


    it ( 'keyCallback returning IGNORE drops the key (unchanged behavior)', () => {
                const x = { name: 'Peter', age: 47 }
                const r = walk ({
                          data: x
                        , keyCallback: ({ key, value, IGNORE }) => key === 'age' ? IGNORE : value
                    })
                expect ( r.name ).toBe ( 'Peter' )
                expect ( r ).not.toHaveProperty ( 'age' )
      }) // it keyCallback returning IGNORE


    it ( 'keyCallback substituting an object preserves iteration order of the current level (deferred via extend)', () => {
                // When keyCallback substitutes an object for one key, the new walk
                // is deferred via the extend mechanism. The other keys at the same
                // level are still visited in Object.keys order, and the new
                // structure's keys are visited after the level completes.
                const x = { a: 1, b: 'two', c: 3, d: 4 }
                const visitOrder = []
                walk ({
                          data: x
                        , keyCallback: ({ key, value }) => {
                                              visitOrder.push ( key )
                                              if ( key === 'b' )   return { nested: 'object' }
                                              return value
                                          }
                    })
                // First 4 visits are the level's own keys in Object.keys order
                expect ( visitOrder.slice ( 0, 4 ) ).toEqual ( [ 'a', 'b', 'c', 'd' ] )
                // The substituted structure's key is visited after the level
                expect ( visitOrder ).toContain ( 'nested' )
                expect ( visitOrder.indexOf ( 'nested' ) ).toBeGreaterThan ( visitOrder.indexOf ( 'd' ) )
      }) // it order preservation


    it ( 'keyCallback returning a primitive still stores it as a leaf (no descent)', () => {
                const x = { name: 'Peter' }
                let descents = 0
                const r = walk ({
                          data: x
                        , objectCallback: ({ value, key }) => {
                                              if ( key === 'name' )   descents++
                                              return value
                                          }
                        , keyCallback: ({ key, value }) => key === 'name' ? 'renamed' : value
                    })
                expect ( r.name ).toBe ( 'renamed' )
                expect ( descents ).toBe ( 0 )   // string is 'simple', no descent
      }) // it keyCallback returning a primitive


    it ( 'keyCallback returning a nested object with arrays is fully walked', () => {
                const x = { config: 'placeholder' }
                const r = walk ({
                          data: x
                        , keyCallback: ({ key, value }) => key === 'config'
                                              ? { db: { host: 'localhost', ports: [ 5432, 5433 ] } }
                                              : value
                    })
                expect ( r.config.db.host ).toBe ( 'localhost' )
                expect ( r.config.db.ports ).toEqual ( [ 5432, 5433 ] )
                // Walk produced a deep copy, not a reference to the input
                expect ( r.config ).not.toBe ( x.config )
      }) // it keyCallback returning a nested object with arrays


}) // describe

