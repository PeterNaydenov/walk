"use strict"

import { describe, it, expect } from 'vitest'
import walk from '../src/main.js'



describe ( 'Walk: PASS', () => {

    it ( 'Skip keyCallback locally and resume both callbacks on nested objects', () => {
                const data = { outside:1, branch:{ count:2, nested:{ count:3 } }, after:4 }
                const objects = [], keys = [];

                const r = walk ({
                          data
                        , objectCallback : ({ value, key, PASS }) => {
                                              objects.push ( key )
                                              return key === 'branch' ? PASS() : value
                                          }
                        , keyCallback : ({ value, breadcrumbs }) => {
                                              keys.push ( breadcrumbs )
                                              return value * 2
                                          }
                    })

                expect ( r ).toEqual ({ outside:2, branch:{ count:2, nested:{ count:6 } }, after:8 })
                expect ( objects ).toEqual ([ 'root', 'branch', 'nested' ])
                expect ( keys ).toEqual ([ 'root/outside', 'root/after', 'root/branch/nested/count' ])
                expect ( r.branch ).not.toBe ( data.branch )
                expect ( r.branch.nested ).not.toBe ( data.branch.nested )
        }) // it Skip keyCallback locally



    it.each ([ false, true ]) ( 'PASS on the root preserves immediate values (array: %s)', array => {
                const data = array ? [ 1, { number:2 } ] : { number:1, nested:{ number:2 } }
                const objects = []

                const r = walk ({
                          data
                        , objectCallback : ({ value, key, PASS }) => {
                                              objects.push ( key )
                                              return key === 'root' ? PASS() : value
                                          }
                        , keyCallback : ({ value }) => value * 10
                    })

                expect ( r ).toEqual ( array ? [ 1, { number:20 } ] : { number:1, nested:{ number:20 } } )
                expect ( r ).not.toBe ( data )
                expect ( objects ).toEqual ( array ? ['root','1'] : ['root','nested'] )
        }) // it PASS on the root



    it ( 'PASS on an array skips its primitive elements while nested callbacks can filter', () => {
                const data = { list:[ 1, { number:2 }, [3], { drop:true }, 4 ] }

                const r = walk ({
                          data
                        , objectCallback : ({ value, key, PASS, IGNORE }) => {
                                              if ( value.drop )     return IGNORE()
                                              if ( key === 'list' ) return PASS()
                                              return value
                                          }
                        , keyCallback : ({ value }) => value * 10
                    })

                expect ( r.list ).toEqual ([ 1, { number:20 }, [30], 4 ])
                expect ( r.list ).not.toBe ( data.list )
                expect ( r.list[1] ).not.toBe ( data.list[1] )
                expect ( r.list[2] ).not.toBe ( data.list[2] )
        }) // it PASS on an array



    it ( 'Each nested object can independently return PASS', () => {
                const r = walk ({
                          data : { branch:{ number:1, nested:{ number:2, deeper:{ number:3 } } } }
                        , objectCallback : ({ value, key, PASS }) => key === 'branch' || key === 'nested' ? PASS() : value
                        , keyCallback : ({ value }) => value * 10
                    })

                expect ( r ).toEqual ({ branch:{ number:1, nested:{ number:2, deeper:{ number:30 } } } })
        }) // it Each nested object can independently return PASS()



    it ( 'IGNORE removes the entire branch and prevents callbacks inside it', () => {
                const objects = [], keys = [];

                const r = walk ({
                          data : { branch:{ number:1, nested:{ number:2 } }, outside:3 }
                        , objectCallback : ({ value, key, IGNORE }) => {
                                              objects.push ( key )
                                              return key === 'branch' ? IGNORE() : value
                                          }
                        , keyCallback : ({ value, key }) => {
                                              keys.push ( key )
                                              return value
                                          }
                    })

                expect ( r ).toEqual ({ outside:3 })
                expect ( objects ).toEqual ([ 'root', 'branch' ])
                expect ( keys ).toEqual ([ 'outside' ])
        }) // it IGNORE removes the entire branch



    it.each ([
              { breadcrumbs:true, parentPath:true }
            , { breadcrumbs:false, parentPath:true }
            , { breadcrumbs:true, parentPath:false }
            , { breadcrumbs:false, parentPath:false }
        ]) ( 'PASS works with metadata settings: %j', settings => {
                const extra = { multiplier:10 }
                const r = walk ({
                          data : { branch:{ number:1, nested:{ number:2 } } }
                        , settings
                        , objectCallback : ({ value, key, PASS }, received ) => {
                                              expect ( received ).toBe ( extra )
                                              return key === 'branch' ? PASS() : value
                                          }
                        , keyCallback : ({ value, key, breadcrumbs, parentPath }, received ) => {
                                              expect ( received ).toBe ( extra )
                                              expect ( key ).toBe ( 'number' )
                                              expect ( breadcrumbs ).toBe ( settings.breadcrumbs ? 'root/branch/nested/number' : undefined )
                                              expect ( parentPath ).toEqual ( settings.parentPath ? ['root','branch','nested'] : undefined )
                                              return value * received.multiplier
                                          }
                    }, extra )

                expect ( r ).toEqual ({ branch:{ number:1, nested:{ number:20 } } })
        }) // it PASS works with metadata settings



    it ( 'PASS with no keyCallback still creates an independent nested copy', () => {
                const data = { branch:{ number:1, nested:{ number:2 } } }
                const r = walk ({ data, objectCallback:({ PASS }) => PASS() })

                expect ( r ).toEqual ( data )
                expect ( r ).not.toBe ( data )
                expect ( r.branch ).not.toBe ( data.branch )
                expect ( r.branch.nested ).not.toBe ( data.branch.nested )
        }) // it PASS with no keyCallback



    it ( 'Preserve built-in references and read immediate getters once under PASS', () => {
                let reads = 0
                const when = new Date ( '2026-10-03' )
                const data = { get number () { return ++reads }, when, nested:{ number:2 } }

                const r = walk ({
                          data
                        , objectCallback : ({ value, key, PASS }) => key === 'root' ? PASS() : value
                        , keyCallback : ({ value }) => value * 10
                    })

                expect ( reads ).toBe ( 1 )
                expect ( r.number ).toBe ( 1 )
                expect ( r.when ).toBe ( when )
                expect ( r.nested.number ).toBe ( 20 )
        }) // it Preserve built-in references and getters under PASS



    it ( 'Resume keyCallback when a nested objectCallback returns a primitive outside PASS', () => {
                const r = walk ({
                          data : { branch:{ number:1, nested:{ number:2 } }, sibling:{} }
                        , objectCallback : ({ value, key, PASS }) => {
                                              if ( key === 'branch' )   return PASS()
                                              if ( key === 'nested' || key === 'sibling' )   return 3
                                              return value
                                          }
                        , keyCallback : ({ value }) => value * 10
                    })

                expect ( r ).toEqual ({ branch:{ number:1, nested:3 }, sibling:30 })
        }) // it Resume keyCallback outside PASS



    it ( 'An unrelated symbol returned by objectCallback remains a value', () => {
                const token = Symbol ( 'pass___' )
                const r = walk ({
                          data : { branch:{} }
                        , objectCallback : ({ value, key }) => key === 'branch' ? token : value
                        , keyCallback : ({ value }) => value
                    })

                expect ( r.branch ).toBe ( token )
        }) // it An unrelated symbol remains a value



    it ( 'Ignoring an array root returns an empty array without visiting its contents', () => {
                const r = walk ({
                          data : [{ number:1 }]
                        , objectCallback : ({ key, IGNORE }) => {
                                              expect ( key ).toBe ( 'root' )
                                              return IGNORE()
                                          }
                        , keyCallback : () => { throw new Error ( 'Ignored contents were visited' ) }
                    })

                expect ( r ).toEqual ( [] )
        }) // it Ignoring an array root

    it.each ([ false, true ]) ( 'PASS a replacement root and resume callbacks in its children (array: %s)', array => {
                const data = array ? { original:1 } : [1]
                const replacement = array ? [ 2, { count:3 } ] : { count:2, nested:{ count:3 } }
                const objects = []

                const r = walk ({
                          data
                        , objectCallback : ({ value, key, PASS }) => {
                                              objects.push ( key )
                                              return key === 'root' ? PASS ( replacement ) : value
                                          }
                        , keyCallback : ({ value }) => value * 10
                    })

                expect ( r ).toEqual ( array ? [ 2, { count:30 } ] : { count:2, nested:{ count:30 } } )
                expect ( r ).not.toBe ( replacement )
                expect ( objects ).toEqual ( array ? ['root','1'] : ['root','nested'] )
                expect ( data ).toEqual ( array ? { original:1 } : [1] )
                expect ( replacement ).toEqual ( array ? [ 2, { count:3 } ] : { count:2, nested:{ count:3 } } )
        }) // it PASS a replacement root



    it.each ([ false, true ]) ( 'PASS a replacement branch using its existing location (array: %s)', array => {
                const data = { branch:array ? { original:1 } : [1], outside:4 }
                const replacement = array ? [ 2, { count:3 } ] : { count:2, nested:{ count:3 } }
                const keys = []

                const r = walk ({
                          data
                        , objectCallback : ({ value, key, PASS }) => key === 'branch' ? PASS ( replacement ) : value
                        , keyCallback : ({ value, breadcrumbs, parentPath }) => {
                                              keys.push ({ breadcrumbs, parentPath })
                                              return value * 10
                                          }
                    })

                expect ( r ).toEqual ({ branch:array ? [ 2, { count:30 } ] : { count:2, nested:{ count:30 } }, outside:40 })
                expect ( r.branch ).not.toBe ( replacement )
                expect ( keys ).toEqual ([
                          { breadcrumbs:'root/outside', parentPath:['root'] }
                        , { breadcrumbs:array ? 'root/branch/1/count' : 'root/branch/nested/count', parentPath:['root','branch',array ? '1' : 'nested'] }
                    ])
                expect ( data.branch ).toEqual ( array ? { original:1 } : [1] )
        }) // it PASS a replacement branch



    it.each ([ undefined, null, false, 0, '', 'changed' ]) ( 'PASS stores an explicit simple replacement directly: %s', replacement => {
                const keyCallback = () => { throw new Error ( 'Copied replacement reached keyCallback' ) }
                const root = walk ({ data:{ original:1 }, objectCallback:({ PASS }) => PASS ( replacement ), keyCallback })
                const object = walk ({
                          data : { branch:{} }
                        , objectCallback : ({ value, key, PASS }) => key === 'branch' ? PASS ( replacement ) : value
                        , keyCallback
                    })
                const array = walk ({
                          data : [{}]
                        , objectCallback : ({ value, key, PASS }) => key === '0' ? PASS ( replacement ) : value
                        , keyCallback
                    })

                expect ( root ).toBe ( replacement )
                expect ( object ).toEqual ({ branch:replacement })
                expect ( Object.hasOwn ( object, 'branch' ) ).toBe ( true )
                expect ( array ).toEqual ([ replacement ])
        }) // it PASS stores an explicit simple replacement



    it ( 'PASS can modify immediate values while nested callbacks still filter', () => {
                const data = { branch:{ count:1, nested:{ count:2 }, removed:{ count:3 } } }
                const r = walk ({
                          data
                        , objectCallback : ({ value, key, PASS, IGNORE }) => {
                                              if ( key === 'branch' )    return PASS ({ ...value, count:100 })
                                              if ( key === 'removed' )   return IGNORE()
                                              return value
                                          }
                        , keyCallback : ({ value }) => value * 10
                    })

                expect ( r ).toEqual ({ branch:{ count:100, nested:{ count:20 } } })
                expect ( data.branch.count ).toBe ( 1 )
                expect ( data.branch.removed ).toEqual ({ count:3 })
                expect ( r.branch.nested ).not.toBe ( data.branch.nested )
        }) // it PASS can modify immediate values



    it ( 'Ordinary objects and tuples remain data without reading instruction-like getters', () => {
                let reads = 0
                const replacement = { get hasValue () { return ++reads }, value:2 }
                const r = walk ({
                          data : { branch:{}, tuple:{} }
                        , objectCallback : ({ value, key }) => {
                                              if ( key === 'branch' )   return replacement
                                              if ( key === 'tuple' )    return [3,4]
                                              return value
                                          }
                        , keyCallback : ({ value }) => value * 10
                    })

                expect ( reads ).toBe ( 1 )
                expect ( r ).toEqual ({ branch:{ hasValue:10, value:20 }, tuple:[30,40] })
        }) // it Ordinary objects and tuples remain data

    it ( 'Returning a helper without calling it stores a function value', () => {
                let pass, ignore
                const r = walk ({
                          data : { branch:{}, leaf:1 }
                        , objectCallback : ({ value, key, PASS }) => {
                                              pass = PASS
                                              return key === 'branch' ? PASS : value
                                          }
                        , keyCallback : ({ value, key, IGNORE }) => {
                                              ignore = IGNORE
                                              return key === 'leaf' ? IGNORE : value
                                          }
                    })

                expect ( r.branch ).toBe ( pass )
                expect ( r.leaf ).toBe ( ignore )
                expect ( walk ({ data:{}, objectCallback:({ IGNORE }) => IGNORE }) ).toBe ( ignore )
        }) // it Returning a helper without calling it



    it ( 'An unrelated symbol cannot remove a branch or a key', () => {
                const token = Symbol ( 'ignore___' )
                const r = walk ({
                          data : { branch:{}, leaf:1 }
                        , objectCallback : ({ value, key }) => key === 'branch' ? token : value
                        , keyCallback : ({ value, key }) => key === 'leaf' ? token : value
                    })

                expect ( r ).toEqual ({ branch:token, leaf:token })
        }) // it An unrelated symbol cannot remove data

}) // describe
