"use strict"

const
      chai = require ( 'chai' )
    , expect = chai.expect
    , walk = require ( '../src/main.js' )
    ;


describe ( 'Walk', () => {

    it ( 'Copy a primitive value', () => {
                let
                      x = 12
                    , r = walk ( x, v => v )
                    ;

                x = 64
                expect ( r ).to.be.equal ( 12 )
                expect ( r !== x )
        }) // it copy a primitives



    it ( 'Copy array of strings', () => {
                let 
                      x = [ 'one', 'two', 'three' ]
                    , r = walk ( x, v => v )
                    ;
                x.push ( 'four' )
                expect ( r ).to.have.length ( 3 )
        }) // it copy array of strings



    it ( 'Copy a single level deep object', () => {
                let 
                      x = { name:'Peter', age: 47 }
                    , r = walk ( x )
                    , z = x
                    ;
                x.test = 'hello'
                expect ( r ).to.not.have.property ( 'test' )
                expect ( z ).to.have.property ( 'test' )
        }) // it copy a single level deep object



    it ( 'Copy a mixed structure', () => {
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
                  , r = walk ( x )
                  ;
                r.props.sizes.push ( 66 )
                x.props.sizes[0] = 222222
                x.props.test = 'hello'

                expect ( x.props.sizes ).to.have.length ( 4 )
                expect ( r.props.sizes ).to.have.length ( 5 )
                expect ( x.props.sizes[0] !== r.props.sizes[0])

                expect ( r.props ).to.not.have.property ( 'test' )
        }) // it Copy a mixed structure



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
                  , r = walk ( x, (v,k) => {
                                        if ( k === 'name' )   return null
                                        return v
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
                let r = walk ( x, (v,k,breadcrumbs) => {
                                            if ( breadcrumbs.includes('root/props/sizes'))   return null
                                            return 'xxx' 
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
                  let r = walk ( x, v => null )
                  expect ( r ).to.have.property ( 'ls' )
                  expect ( r ).to.have.property ( 'props' )
                  expect ( r.props ).to.have.property ( 'sizes' )

                  expect ( r       ).to.not.have.property ( 'name' )
                  expect ( r.props ).to.not.have.property ( 'age' )

                  expect ( r.ls.length ).to.be.equal  ( 0 )
                  expect ( r.props.sizes.length ).to.be.equal ( 0 )
      })



}) // describe


