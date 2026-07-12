"use strict"

import { describe, it, expect } from 'vitest'
import walk from '../src/main.js'



describe ( 'Walk: objectCallback', () => {

      it ( 'Object callback function only', () => {
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

                function oCallbackFn ({ value:o }) {
                          const { age, height } = o;
                          if ( age == 47 )   return { eyeColor:'dark', height }
                          else               return o
                      }

                let r = walk ({ data:x, objectCallback:oCallbackFn })
                expect ( r.props ).not.toHaveProperty ( 'age'   )
                expect ( r.props ).not.toHaveProperty ( 'sizes' )
                expect ( r.props.eyeColor ).toBe ( 'dark'  )
      }) // it object callback


      it ( 'Object callback returns null', () => {
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

                function oCallbackFn ({ value:o, key:k, breadcrumbs, IGNORE }) {
                          const { sizes } = o;
                          if ( sizes )   return IGNORE
                          else           return o
                      }

                let r = walk ({ data : x, objectCallback: oCallbackFn })
                expect ( r ).not.toHaveProperty ( 'props' )
      }) // it object callback null



    it ( 'Object callback returns a string', () => {
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

                function oCallbackFn ({ value:o }) {
                          const { sizes } = o;
                          if ( sizes )   return 'list'
                          else           return o
                      }

                let r = walk ({ data : x, objectCallback : oCallbackFn })
                expect ( r ).toHaveProperty ( 'props' )
                expect ( r.props ).toBe ( 'list' )
      }) // it object callback null



    it ( 'Object callback changes the data', () => {
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

                function oCallbackFn ({ value:o, key:k }) {
                          const { sizes } = o;
                          if ( sizes )    o.sizes = [ 'list' ]
                          return o
                      }

                let r = walk ({ data:x, objectCallback:oCallbackFn })
                expect ( r ).toHaveProperty ( 'props' )
                expect ( r.props ).toHaveProperty ( 'sizes' )
                expect ( r.props.sizes ).toHaveLength ( 1 )
                expect ( r.props.sizes[0]).toBe ( 'list' )
      }) // it object callback changes the data



    it ( 'Object callback checks key', () => {
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

                function oCallbackFn ({ value:o, key, IGNORE }) {
                          if ( key === 'props' )   return IGNORE
                          return o
                      }

                let r = walk ({ data : x, objectCallback: oCallbackFn })
                expect ( r ).not.toHaveProperty ( 'props' )
      }) // it Object callback checks key



    it ( 'Object callback checks breadcrumbs', () => {
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

                function oCallbackFn ({ value:o, key, breadcrumbs, IGNORE }) {
                          if ( breadcrumbs === 'root/props' )   return IGNORE
                          return o
                      }

                let r = walk ({ data:x, objectCallback:oCallbackFn })
                expect ( r ).not.toHaveProperty ( 'props' )
      }) // it Object callback checks breadcrumbs



    it ( 'Prevent array empty items', () => {
                let
                    x = [
                              { id: 1 }
                            , { id: 2 }
                            , { id: 3 }
                            , { id: 5 }
                        ];

                function oCallbackFn ({ value:o, key, IGNORE }) {
                                    if ( key === 'root' ) return o
                                    if ( o.id === 5     ) return o
                                    return IGNORE
                      }

                let r = walk ({ data : x, objectCallback : oCallbackFn })
                expect ( r.length ).toBe ( 1 )
      }) // it Prevent array empty items



    it ( 'Prevent array empty items 2', () => {
                let
                    x = [
                              [1]
                            , [2]
                            , [3]
                            , [5]
                        ];

                function oCallbackFn ({ value:o, key, IGNORE }) {
                          if ( key === 'root' ) return o
                          if ( o[0] === 5     ) return o
                          return IGNORE
                      }

                let r = walk ({ data:x, objectCallback: oCallbackFn })
                expect ( r.length ).toBe ( 1 )
      }) // it Prevent array empty items 2



    it ( 'Prevent array empty items 3 - primitives, no keyCallback', () => {
                let
                    x = [
                              { id: 1 }
                            , 'hello'
                            , 'world'
                        ];

                function oCallbackFn ({ value:o, key, IGNORE }) {
                          if ( key === 'root' )            return o
                          if ( typeof o === 'object' )     return IGNORE
                          return o
                      }

                let r = walk ({ data:x, objectCallback: oCallbackFn })
                expect ( r.length ).toBe ( 2 )
                expect ( r ).toEqual ([ 'hello', 'world' ])
                expect ( 0 in r ).toBe ( true )   // no holes
      }) // it Prevent array empty items 3 - primitives, no keyCallback



    it ( 'Set a value to NULL', () => {
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

                  function objToNull ({value,key }) {
                            if ( key === 'props' )   return null
                            return value
                      } // objToNull func.

                  let r = walk ({ data:x, objectCallback:objToNull })
                  expect ( r.props ).toBe ( null )
      }) // it Set a value to NULL



    it ( 'Set a value to undefined', () => {
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

                  function objToNull ({value,key }) {
                            if ( key === 'props' )   return undefined
                            return value
                      } // objToNull func.

                  let r = walk ({ data:x, objectCallback:objToNull })
                  expect ( r.props ).toBe ( undefined )
      }) // it Set a value to undefined




    it ( 'Object callback on root object', () => {
      // Trigger a object callback on root object.
      // Modify some root object properties from object callback
                  let
                      x = {
                                ls   : [ 1,2,3 ]
                              , name : 'Peter'
                              , age : 50
                              , props : {
                                            eyeColor: 'blue'
                                          , age     : 47
                                          , height  : 176
                                          , sizes : [12,33,12,21]
                                      }
                              };

                  function oCallbackFn ({ value:o, key:k, breadcrumbs, IGNORE }) {
                            if ( k === 'root' ) {
                                    o.name = 'John'
                                    o.age = 30
                              }
                            return o
                        }

                  let r = walk ({ data : x, objectCallback: oCallbackFn })

                  expect ( r ).toHaveProperty ( 'name' )
                  expect ( r.name ).toBe ( 'John' )
                  expect ( r.age ).toBe ( 30 )
      }) // it Object callback on root object



    it ( 'Object callback replaces root with a string', () => {
                  let x = { a: 1 };

                  function oCallbackFn ({ value:o, key:k }) {
                            if ( k === 'root' )   return 'list'
                            return o
                        }

                  let r = walk ({ data : x, objectCallback: oCallbackFn })
                  expect ( r ).toBe ( 'list' )
      }) // it Object callback replaces root with a string



    it ( 'Object callback replaces root with null', () => {
                  let x = { a: 1 };

                  function oCallbackFn ({ value:o, key:k }) {
                            if ( k === 'root' )   return null
                            return o
                        }

                  let r = walk ({ data : x, objectCallback: oCallbackFn })
                  expect ( r ).toBe ( null )
      }) // it Object callback replaces root with null



    it ( 'Object callback ignores root', () => {
                  let x = { a: 1 };

                  function oCallbackFn ({ value:o, key:k, IGNORE }) {
                            if ( k === 'root' )   return IGNORE
                            return o
                        }

                  let r = walk ({ data : x, objectCallback: oCallbackFn })
                  expect ( r ).toEqual ({})
      }) // it Object callback ignores root

}) // describe

