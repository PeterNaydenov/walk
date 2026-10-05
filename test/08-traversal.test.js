"use strict"

import { describe, it, expect } from 'vitest'
import walk from '../src/main.js'



describe ( 'Walk: settings.copy', () => {

    it.each ([
              { breadcrumbs:true, parentPath:true }
            , { breadcrumbs:false, parentPath:true }
            , { breadcrumbs:true, parentPath:false }
            , { breadcrumbs:false, parentPath:false }
        ]) ( 'Preserve callback order, paths, and extra arguments without copying: %j', settings => {
                const data = { outside:1, branch:{ number:2 }, list:[3,{ number:4 }] }
                const extra = { multiplier:2 }

                function visit ( copy ) {
                    const events = []
                    function record ( kind, context, received ) {
                        expect ( received ).toBe ( extra )
                        expect ( Object.hasOwn ( context, 'breadcrumbs' ) ).toBe ( settings.breadcrumbs )
                        expect ( Object.hasOwn ( context, 'parentPath' ) ).toBe ( settings.parentPath )
                        if ( settings.parentPath )   expect ( Object.isFrozen ( context.parentPath ) ).toBe ( true )
                        events.push ({ kind, key:context.key, breadcrumbs:context.breadcrumbs, parentPath:context.parentPath })
                    } // record func.
                    const result = walk ({
                              data
                            , settings : { ...settings, copy }
                            , objectCallback : ( context, received ) => {
                                                  record ( 'object', context, received )
                                                  return context.value
                                              }
                            , keyCallback : ( context, received ) => {
                                                  record ( 'key', context, received )
                                                  return context.value * received.multiplier
                                              }
                        }, extra )
                    return { result, events }
                } // visit func.

                const copied = visit ( true ), visited = visit ( false );
                expect ( visited.result ).toBeUndefined()
                expect ( visited.events ).toEqual ( copied.events )
                expect ( copied.result ).toEqual ({ outside:2, branch:{ number:4 }, list:[6,{ number:8 }] })
                expect ( data ).toEqual ({ outside:1, branch:{ number:2 }, list:[3,{ number:4 }] })
        }) // it Preserve callback order and paths



    it.each ([ undefined, true, null, 0, '', 'false' ]) ( 'Only literal false disables copying: %s', copy => {
                const data = [{ number:1 }]
                const r = walk ({ data, settings:{ copy }, keyCallback:({ value }) => value + 1 })

                expect ( r ).toEqual ([ { number:2 } ])
                expect ( r ).not.toBe ( data )
                expect ( r[0] ).not.toBe ( data[0] )
        }) // it Only literal false disables copying



    it.each ([ undefined, null, false, 0, 'text', Symbol ( 'value' ), () => 1, new Date(), new Map() ]) ( 'Return undefined for a leaf root without calling callbacks: %s', data => {
                const callback = () => { throw new Error ( 'Leaf root reached a callback' ) }
                const r = walk ({ data, settings:{ copy:false }, keyCallback:callback, objectCallback:callback })

                expect ( r ).toBeUndefined()
        }) // it Return undefined for a leaf root



    it.each ([ undefined, null, 42 ]) ( 'Discard simple root replacements: %s', replacement => {
                const r = walk ({
                          data : { number:1 }
                        , settings : { copy:false }
                        , objectCallback : ({ key }) => {
                                              expect ( key ).toBe ( 'root' )
                                              return replacement
                                          }
                        , keyCallback : () => { throw new Error ( 'Root replacement reached keyCallback' ) }
                    })

                expect ( r ).toBeUndefined()
        }) // it Discard simple root replacements



    it.each ([ { number:1, nested:{} }, [1,{}] ]) ( 'IGNORE on the root returns undefined and prevents child callbacks: %j', data => {
                const r = walk ({
                          data
                        , settings : { copy:false }
                        , objectCallback : ({ key, IGNORE }) => {
                                              expect ( key ).toBe ( 'root' )
                                              return IGNORE()
                                          }
                        , keyCallback : () => { throw new Error ( 'Ignored root was visited' ) }
                    })

                expect ( r ).toBeUndefined()
        }) // it IGNORE on the root



    it ( 'IGNORE prunes a branch without deleting anything from the input', () => {
                const data = Object.freeze ({ keep:1, remove:2, branch:Object.freeze ({ number:3 }) })
                const objects = [], keys = [];
                const r = walk ({
                          data
                        , settings : { copy:false }
                        , objectCallback : ({ value, key, IGNORE }) => {
                                              objects.push ( key )
                                              return key === 'branch' ? IGNORE() : value
                                          }
                        , keyCallback : ({ value, key, IGNORE }) => {
                                              keys.push ( key )
                                              return key === 'remove' ? IGNORE() : value
                                          }
                    })

                expect ( r ).toBeUndefined()
                expect ( objects ).toEqual ([ 'root', 'branch' ])
                expect ( keys ).toEqual ([ 'keep', 'remove' ])
                expect ( data ).toEqual ({ keep:1, remove:2, branch:{ number:3 } })
        }) // it IGNORE prunes a branch



    it.each ([ false, true ]) ( 'PASS on the root skips immediate keys but visits nested containers (array: %s)', array => {
                const data = array ? [1,{ number:2 }] : { number:1, nested:{ number:2 } }
                const objects = [], keys = [];
                const r = walk ({
                          data
                        , settings : { copy:false }
                        , objectCallback : ({ value, key, PASS }) => {
                                              objects.push ( key )
                                              return key === 'root' ? PASS() : value
                                          }
                        , keyCallback : ({ value, breadcrumbs }) => {
                                              keys.push ( breadcrumbs )
                                              return value
                                          }
                    })

                expect ( r ).toBeUndefined()
                expect ( objects ).toEqual ( array ? ['root','1'] : ['root','nested'] )
                expect ( keys ).toEqual ( array ? ['root/1/number'] : ['root/nested/number'] )
        }) // it PASS on the root



    it.each ([ false, true ]) ( 'PASS a changed branch and resume nested callbacks (array: %s)', array => {
                const data = { branch:array ? {} : [], outside:4 }
                const replacement = array ? [1,{ number:2 }] : { number:1, nested:{ number:2 } }
                const keys = []
                const r = walk ({
                          data
                        , settings : { copy:false }
                        , objectCallback : ({ value, key, PASS }) => key === 'branch' ? PASS ( replacement ) : value
                        , keyCallback : ({ value, breadcrumbs, parentPath }) => {
                                              keys.push ({ breadcrumbs, parentPath })
                                              return value * 2
                                          }
                    })

                expect ( r ).toBeUndefined()
                expect ( keys ).toEqual ([
                          { breadcrumbs:'root/outside', parentPath:['root'] }
                        , { breadcrumbs:array ? 'root/branch/1/number' : 'root/branch/nested/number', parentPath:['root','branch',array ? '1' : 'nested'] }
                    ])
                expect ( data.branch ).toEqual ( array ? {} : [] )
                expect ( replacement ).toEqual ( array ? [1,{ number:2 }] : { number:1, nested:{ number:2 } } )
        }) // it PASS a changed branch



    it.each ([ undefined, null, 3 ]) ( 'PASS a simple replacement without keyCallback: %s', replacement => {
                const callback = () => { throw new Error ( 'PASS replacement reached keyCallback' ) }
                const root = walk ({ data:{}, settings:{ copy:false }, objectCallback:({ PASS }) => PASS ( replacement ), keyCallback:callback })
                const nested = walk ({
                          data : { branch:{} }
                        , settings : { copy:false }
                        , objectCallback : ({ value, key, PASS }) => key === 'branch' ? PASS ( replacement ) : value
                        , keyCallback : callback
                    })

                expect ( root ).toBeUndefined()
                expect ( nested ).toBeUndefined()
        }) // it PASS a simple replacement



    it.each ([ false, true ]) ( 'Walk into root replacements that change container type (array: %s)', array => {
                const keys = []
                const r = walk ({
                          data : array ? {} : []
                        , settings : { copy:false }
                        , objectCallback : ({ value, key }) => key === 'root' ? ( array ? [1,{ number:2 }] : { list:[1], number:2 } ) : value
                        , keyCallback : ({ value, breadcrumbs }) => {
                                              keys.push ( breadcrumbs )
                                              return value
                                          }
                    })

                expect ( r ).toBeUndefined()
                expect ( keys ).toEqual ( array ? ['root/0','root/1/number'] : ['root/number','root/list/0'] )
        }) // it Walk into root replacements



    it.each ([ false, true ]) ( 'Visit containers returned by keyCallback for object and array properties (array: %s)', array => {
                const keys = [], objects = [];
                const data = array ? [1,2] : { first:1, second:2 }
                const r = walk ({
                          data
                        , settings : { copy:false }
                        , objectCallback : ({ value, breadcrumbs }) => {
                                              objects.push ( breadcrumbs )
                                              return value
                                          }
                        , keyCallback : ({ value, breadcrumbs }) => {
                                              keys.push ( breadcrumbs )
                                              if ( breadcrumbs === ( array ? 'root/0' : 'root/first' ) )    return { nested:{ number:10 } }
                                              if ( breadcrumbs === ( array ? 'root/1' : 'root/second' ) )   return [20]
                                              return value
                                          }
                    })

                expect ( r ).toBeUndefined()
                expect ( keys ).toEqual ( array ? ['root/0','root/1','root/1/0','root/0/nested/number'] : ['root/first','root/second','root/second/0','root/first/nested/number'] )
                expect ( objects ).toEqual ( array ? ['root','root/0/nested'] : ['root','root/first/nested'] )
                expect ( data ).toEqual ( array ? [1,2] : { first:1, second:2 } )
        }) // it Visit containers returned by keyCallback



    it ( 'Visit a primitive returned by objectCallback with keyCallback', () => {
                const keys = []
                const r = walk ({
                          data : { branch:{} }
                        , settings : { copy:false }
                        , objectCallback : ({ value, key }) => key === 'branch' ? 3 : value
                        , keyCallback : ({ value, key }) => {
                                              keys.push ([ key, value ])
                                              return undefined
                                          }
                    })

                expect ( r ).toBeUndefined()
                expect ( keys ).toEqual ([ ['branch',3] ])
        }) // it Visit a primitive returned by objectCallback



    it ( 'Walk without keyCallback and read getters once', () => {
                let reads = 0
                const data = { get number () { return ++reads }, nested:{ list:[{ number:2 }] } }
                const objects = []
                const r = walk ({
                          data
                        , settings : { copy:false }
                        , objectCallback : ({ value, key }) => {
                                              objects.push ( key )
                                              return value
                                          }
                    })

                expect ( r ).toBeUndefined()
                expect ( reads ).toBe ( 1 )
                expect ( objects ).toEqual ([ 'root','nested','list','0' ])
        }) // it Walk without keyCallback



    it ( 'Walk without callbacks and leave array properties and __proto__ untouched', () => {
                let reads = 0
                const list = [1]
                Object.defineProperty ( list, '01', { enumerable:true, get:() => ++reads } )
                const data = JSON.parse ( '{"__proto__":{"safe":1}}' )
                data.list = list
                const r = walk ({ data, settings:{ copy:false } })

                expect ( r ).toBeUndefined()
                expect ( reads ).toBe ( 1 )
                expect ( Object.getPrototypeOf ( data ) ).toBe ( Object.prototype )
                expect ( Object.hasOwn ( data, '__proto__' ) ).toBe ( true )
                expect ( list.length ).toBe ( 1 )
                expect ( Object.hasOwn ( list, '01' ) ).toBe ( true )
        }) // it Walk without callbacks



    it ( 'Collect leaves with callbacks that do not return values', () => {
                const data = { first:1, nested:{ second:2 } }
                const values = []
                const r = walk ({ data, settings:{ copy:false }, keyCallback:({ value }) => { values.push ( value ) } })

                expect ( r ).toBeUndefined()
                expect ( values ).toEqual ([1,2])
                expect ( data ).toEqual ({ first:1, nested:{ second:2 } })
        }) // it Collect leaves without returned values



    it ( 'Visit built-ins and functions as leaves by reference', () => {
                const data = { when:new Date(), lookup:new Map(), callback:() => 1, nested:{ bytes:new Uint8Array ([1]) } }
                const values = []
                const r = walk ({ data, settings:{ copy:false }, keyCallback:({ value }) => { values.push ( value ); return value } })

                expect ( r ).toBeUndefined()
                expect ( values ).toEqual ([ data.when, data.lookup, data.callback, data.nested.bytes ])
                expect ( values[0] ).toBe ( data.when )
                expect ( values[3] ).toBe ( data.nested.bytes )
        }) // it Visit built-ins by reference



    it ( 'Walk a 4000-level structure without recursive calls or a result', () => {
                let data = { number:1 }, calls = 0;
                for ( let i = 0; i < 4000; i++ )   data = { child:data }
                const r = walk ({
                          data
                        , settings : { copy:false, breadcrumbs:false, parentPath:false }
                        , keyCallback : ({ value }) => { calls++; return value }
                    })

                expect ( r ).toBeUndefined()
                expect ( calls ).toBe ( 1 )
                let leaf = data
                for ( let i = 0; i < 4000; i++ )   leaf = leaf.child
                expect ( leaf.number ).toBe ( 1 )
        }) // it Walk a 4000-level structure

}) // describe
