"use strict"

import chai from 'chai'
import walk from '../src/main.js'
const expect = chai.expect;



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
                                , keyCallback : ({value:v,key:k}) => {
                                                      if ( k === 'name' )   return null
                                                      return v
                                                  }
                          })
                  ;
              expect ( r ).to.not.have.property ( 'name' )
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
                                , keyCallback : ({value:v,key:k,breadcrumbs}) => {
                                                        if ( breadcrumbs.includes('root/props/sizes'))   return null
                                                        return 'xxx' 
                                                    }
                          })
                expect ( r.name       ).to.be.equal ( 'xxx' )
                expect ( r.props.age  ).to.be.equal ( 'xxx' )
                expect ( r.props.sizes.length ).to.be.equal ( 0 )
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
                  let r = walk ({ data:x, keyCallback: () => null })
                  expect ( r ).to.have.property ( 'ls' )
                  expect ( r ).to.have.property ( 'props' )
                  expect ( r.props ).to.have.property ( 'sizes' )

                  expect ( r       ).to.not.have.property ( 'name' )
                  expect ( r.props ).to.not.have.property ( 'age' )

                  expect ( r.ls.length ).to.be.equal  ( 0 )
                  expect ( r.props.sizes.length ).to.be.equal ( 0 )
      }) // it No properties

      
      
}) // describe


