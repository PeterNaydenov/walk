"use strict"

import chai from 'chai'
import walk from '../src/main.js'
const expect = chai.expect;



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
                expect ( r.props ).to.not.have.property ( 'age'   )
                expect ( r.props ).to.not.have.property ( 'sizes' )
                expect ( r.props.eyeColor ).to.be.equal ( 'dark'  )
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
                expect ( r ).to.not.have.property ( 'props' )                
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
                expect ( r ).to.have.property ( 'props' )
                expect ( r.props ).to.be.equal ( 'list' )
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
                expect ( r ).to.have.property ( 'props' )
                expect ( r.props ).to.have.property ( 'sizes' )
                expect ( r.props.sizes ).to.have.length ( 1 )
                expect ( r.props.sizes[0]).to.be.equal ( 'list' )
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
                expect ( r ).to.not.have.property ( 'props' )                
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
                expect ( r ).to.not.have.property ( 'props' )
      }) // it Object callback checks breadcrumbs



    it ( 'Prevent array empty items', () => {
                let 
                    x = [
                              { id: 1 }
                            , { id: 2 }
                            , { id: 3 }
                            , { id: 5 }
                        ];

                function oCallbackFn ({ value:o, IGNORE }) {
                          if ( o.id === 5 )   return o
                          return IGNORE
                      }

                let r = walk ({ data : x, objectCallback : oCallbackFn })
                expect ( r.length ).to.be.equal ( 1 )
      }) // it Prevent array empty items



    it ( 'Prevent array empty items 2', () => {
                let 
                    x = [
                              [1]
                            , [2]
                            , [3]
                            , [5]
                        ];

                function oCallbackFn ({ value:o, IGNORE }) {
                          if ( o[0] === 5 )   return o
                          return IGNORE
                      }

                let r = walk ({ data:x, objectCallback: oCallbackFn })
                expect ( r.length ).to.be.equal ( 1 )
      }) // it Prevent array empty items 2


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
                  expect ( r.props ).to.be.equal ( null )
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
                  expect ( r.props ).to.be.equal ( undefined )
      }) // it Set a value to NULL


      
}) // describe


