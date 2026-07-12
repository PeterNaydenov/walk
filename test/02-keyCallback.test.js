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



}) // describe

