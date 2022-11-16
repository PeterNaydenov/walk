"use strict"

import chai from 'chai'
import walk from '../src/main.js'
const expect = chai.expect;



describe ( 'Walk: Deep copy', () => {

    it ( 'Copy a primitive value', () => {
                let
                      x = 12
                    , r = walk ({data:x})
                    ;

                x = 64
                expect ( r ).to.be.equal ( 12 )
                expect ( r !== x )
        }) // it copy a primitives



    it ( 'Copy array of strings', () => {
                let 
                      x = [ 'one', 'two', 'three' ]
                    , r = walk ({ data : x })
                    ;
                x.push ( 'four' )
                expect ( r ).to.have.length ( 3 )
        }) // it copy array of strings



    it ( 'Copy a single level deep object', () => {
                let 
                      x = { name:'Peter', age: 47 }
                    , r = walk ({ data:x })
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
                  , r = walk ({ data : x })
                  ;
                  
                r.props.sizes.push ( 66 )
                x.props.sizes[0] = 222222
                x.props.test = 'hello'

                expect ( x.props.sizes ).to.have.length ( 4 )
                expect ( r.props.sizes ).to.have.length ( 5 )
                expect ( x.props.sizes[0] !== r.props.sizes[0])

                expect ( r.props ).to.not.have.property ( 'test' )
        }) // it Copy a mixed structure


    it ( 'Data property has value "null"', () => {
          const
              data = { name : null }
            , r = walk ({data})
            ;
          expect ( r ).to.have.property ( 'name' )
          expect ( r.name ).to.be.equal ( null )
    }) // it Data property has value null


    it ( 'Data property has "boolean" value', () => {
        const data = {   // Booleans
                      happy : true  
                    , sad   : false
                };
        const r = walk ({ data });
        expect ( r ).to.have.property ( 'happy' )
        expect ( r.happy ).to.be.true
        expect ( r ).to.have.property ( 'sad' )
        expect ( r.sad ).to.be.false
    }) // it Data property has "boolean" value
      
}) // describe


