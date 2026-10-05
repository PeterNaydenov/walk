"use strict"

import { describe, it, expect } from 'vitest'
import walk from '../src/main.js'



describe ( 'Walk: FINISH', () => {

    it.each ([ false, true ]) ( 'Finish an array at its current value (include: %s)', include => {
                const data = [12,22,33,44,55,66]
                const visited = [];

                const r = walk ({
                          data
                        , keyCallback : ({ value, FINISH }) => {
                                              visited.push ( value )
                                              if ( value === 33 )   return include ? FINISH ( value ) : FINISH()
                                              return value
                                          }
                    })

                expect ( r ).toEqual ( include ? [12,22,33] : [12,22] )
                expect ( visited ).toEqual ([12,22,33])
                expect ( data ).toEqual ([12,22,33,44,55,66])
        }) // it Finish an array



    it.each ([ false, true ]) ( 'Finish at an object branch and process only its final keys (include: %s)', include => {
                const data = { a:12, b:15, c:{ internal:44, in1:'bbb', in2:'ccc' }, after:55 }
                const objects = [], keys = [], flags = [];

                const r = walk ({
                          data
                        , objectCallback : ({ key, value, FINISH }) => {
                                              objects.push ( key )
                                              if ( key === 'c' )   return include ? FINISH ( value ) : FINISH()
                                              return value
                                          }
                        , keyCallback : ({ key, value, isFinished }) => { keys.push ( key ); flags.push ( isFinished ); return value }
                    })

                expect ( r ).toEqual ( include ? { a:12, b:15, c:data.c } : { a:12, b:15 } )
                expect ( objects ).toEqual ([ 'root', 'c' ])
                expect ( keys ).toEqual ( include ? ['a','b','internal','in1','in2'] : ['a','b'] )
                expect ( flags ).toEqual ( include ? [false,false,true,true,true] : [false,false] )
                if ( include )   expect ( r.c ).not.toBe ( data.c )
                expect ( data.after ).toBe ( 55 )
        }) // it Finish at an object branch



    it.each ([ false, true ]) ( 'Omit an object or array root when finishing without a value (array: %s)', array => {
                const data = array ? [1,{}] : { number:1, branch:{} }
                let calls = 0;

                const r = walk ({
                          data
                        , objectCallback : ({ key, FINISH }) => {
                                              expect ( key ).toBe ( 'root' )
                                              calls++
                                              return FINISH()
                                          }
                        , keyCallback : () => { throw new Error ( 'Finished root was visited' ) }
                    })

                expect ( r ).toEqual ( array ? [] : {} )
                expect ( r ).not.toBe ( data )
                expect ( calls ).toBe ( 1 )
        }) // it Omit a root



    it.each ([ undefined, null, false, 0, '', 'last', { number:1 }, [2], new Date(), () => 3 ]) ( 'Include an explicit final root value directly: %s', value => {
                const r = walk ({
                          data : { original:1 }
                        , objectCallback : ({ FINISH }) => FINISH ( value )
                    })

                expect ( r ).toBe ( value )
        }) // it Include an explicit final root value



    it.each ([ undefined, null, false, 0, '', 'last' ]) ( 'Keep an explicit final leaf value, including undefined: %s', value => {
                const object = walk ({ data:{ before:1, final:2, after:3 }, keyCallback:({ key, value:v, FINISH }) => key === 'final' ? FINISH ( value ) : v })
                const array = walk ({ data:[1,2,3], keyCallback:({ value:v, FINISH }) => v === 2 ? FINISH ( value ) : v })

                expect ( object ).toEqual ({ before:1, final:value })
                expect ( Object.hasOwn ( object, 'final' ) ).toBe ( true )
                expect ( array ).toEqual ([1,value])
                expect ( array.length ).toBe ( 2 )
        }) // it Keep an explicit final leaf value



    it.each ([ false, true ]) ( 'Store final container replacements from keyCallback without walking them (array: %s)', array => {
                const replacement = array ? [2,{ number:3 }] : { get number () { throw new Error ( 'Final contents were read' ) } }
                const data = { first:1, after:4 }
                const objects = [];

                const r = walk ({
                          data
                        , objectCallback : ({ value, key }) => { objects.push ( key ); return value }
                        , keyCallback : ({ FINISH }) => FINISH ( replacement )
                    })

                expect ( r.first ).toBe ( replacement )
                expect ( Object.keys ( r ) ).toEqual ([ 'first' ])
                expect ( objects ).toEqual ([ 'root' ])
                expect ( data ).toEqual ({ first:1, after:4 })
        }) // it Store final container replacements



    it ( 'Keep array compaction and non-index properties when finishing', () => {
                const data = [1,2,3,4]
                const r = walk ({
                          data
                        , keyCallback : ({ value, FINISH, IGNORE }) => {
                                              if ( value === 1 )   return IGNORE()
                                              if ( value === 3 )   return FINISH ( 30 )
                                              return value
                                          }
                    })
                const named = [1]
                named['01'] = 2
                named.after = 3
                const copy = walk ({ data:named, keyCallback:({ key, value, FINISH }) => key === '01' ? FINISH ( value ) : value })

                expect ( r ).toEqual ([2,30])
                expect ( copy.length ).toBe ( 1 )
                expect ( copy['01'] ).toBe ( 2 )
                expect ( Object.keys ( copy ) ).toEqual ([ '0', '01' ])
        }) // it Keep array compaction and non-index properties



    it ( 'Preserve a final __proto__ property without changing the result prototype', () => {
                const data = JSON.parse ( '{"before":1,"__proto__":{"number":2},"after":3}' )
                const r = walk ({ data, objectCallback:({ key, value, FINISH }) => key === '__proto__' ? FINISH ( value ) : value })

                expect ( Object.getPrototypeOf ( r ) ).toBe ( Object.prototype )
                expect ( Object.hasOwn ( r, '__proto__' ) ).toBe ( true )
                expect ( r.__proto__ ).toBe ( data.__proto__ )
                expect ( Object.keys ( r ) ).toEqual ([ 'before', '__proto__' ])
        }) // it Preserve a final __proto__ property



    it ( 'Stop queued containers as well as later keys in the current container', () => {
                const data = { branch:{ first:1, nested:{ number:2 }, final:3, after:4 }, later:{ number:5 }, outside:6 }
                const visited = [];

                const r = walk ({
                          data
                        , keyCallback : ({ value, key, breadcrumbs, FINISH }) => {
                                              visited.push ( breadcrumbs )
                                              return key === 'final' ? FINISH ( value ) : value * 10
                                          }
                    })

                expect ( visited ).toEqual ([ 'root/outside', 'root/branch/first', 'root/branch/final' ])
                expect ( r ).toEqual ({ branch:{ first:10, nested:{}, final:3 }, later:{}, outside:60 })
                expect ( r.branch ).not.toBe ( data.branch )
                expect ( r.later ).not.toBe ( data.later )
        }) // it Stop queued containers



    it ( 'Skip containers queued before finishing in the root contents', () => {
                const r = walk ({
                          data : { queued:{ number:1 }, final:2, after:3 }
                        , keyCallback : ({ key, value, FINISH }) => key === 'final' ? FINISH() : value
                    })

                expect ( r ).toEqual ({ queued:{} })
        }) // it Skip containers queued before finishing



    it ( 'Do not read later getters after finishing', () => {
                let reads = 0
                const data = { first:1, get after () { reads++; throw new Error ( 'Later getter was read' ) } }
                const r = walk ({ data, keyCallback:({ FINISH }) => FINISH ( 10 ) })

                expect ( r ).toEqual ({ first:10 })
                expect ( reads ).toBe ( 0 )
        }) // it Do not read later getters



    it.each ([
              { breadcrumbs:true, parentPath:true }
            , { breadcrumbs:false, parentPath:true }
            , { breadcrumbs:true, parentPath:false }
            , { breadcrumbs:false, parentPath:false, detectCycles:false }
        ]) ( 'Provide FINISH with all path settings and extra arguments: %j', settings => {
                const extra = { number:10 }
                const seen = [];

                const r = walk ({
                          data : { before:1, branch:{ number:2 }, later:{ number:3 } }
                        , settings
                        , objectCallback : ( context, received ) => {
                                              expect ( received ).toBe ( extra )
                                              expect ( typeof context.FINISH ).toBe ( 'function' )
                                              if ( context.key !== 'branch' )   return context.value
                                              expect ( context.breadcrumbs ).toBe ( settings.breadcrumbs ? 'root/branch' : undefined )
                                              expect ( context.parentPath ).toEqual ( settings.parentPath ? ['root'] : undefined )
                                              return context.FINISH ( received )
                                          }
                        , keyCallback : ( context, received ) => {
                                              expect ( received ).toBe ( extra )
                                              expect ( typeof context.FINISH ).toBe ( 'function' )
                                              seen.push ( context.key )
                                              return context.value
                                          }
                    }, extra )

                expect ( r ).toEqual ({ before:1, branch:extra })
                expect ( r.branch ).not.toBe ( extra )
                expect ( seen ).toEqual ([ 'before', 'number' ])
        }) // it Provide FINISH with all path settings



    it.each ([ false, true ]) ( 'Finish from either callback without copying (objectCallback: %s)', object => {
                const data = { first:1, branch:{ number:2 }, final:3, after:4 }
                const seen = [];

                const r = walk ({
                          data
                        , settings : { copy:false }
                        , objectCallback : ({ key, value, FINISH }) => {
                                              seen.push ( key )
                                              return object && key === 'branch' ? FINISH ( value ) : value
                                          }
                        , keyCallback : ({ key, FINISH }) => {
                                              seen.push ( key )
                                              if ( !object && key === 'final' )   return FINISH()
                                          }
                    })

                expect ( r ).toBeUndefined()
                expect ( seen ).toEqual ( object ? ['root','first','branch','number'] : ['root','first','branch','final'] )
                expect ( data ).toEqual ({ first:1, branch:{ number:2 }, final:3, after:4 })
        }) // it Finish without copying



    it.each ([ false, true ]) ( 'Finish a root without copying, with or without a value (include: %s)', include => {
                const r = walk ({
                          data : [1,{}]
                        , settings : { copy:false }
                        , objectCallback : ({ value, FINISH }) => include ? FINISH ( value ) : FINISH()
                        , keyCallback : ({ isFinished, value }) => { expect ( isFinished ).toBe ( true ); return value }
                    })

                expect ( r ).toBeUndefined()
        }) // it Finish a root without copying



    it ( 'Finish from an object callback inside an array after an ignored item', () => {
                const final = { number:2 }
                const r = walk ({
                          data : [{ drop:true }, final, { number:3 }]
                        , objectCallback : ({ key, value, FINISH, IGNORE }) => {
                                              if ( value.drop )   return IGNORE()
                                              if ( key === '1' )   return FINISH ( value )
                                              return value
                                          }
                        , keyCallback : ({ value, isFinished }) => { expect ( isFinished ).toBe ( true ); return value }
                    })

                expect ( r ).toEqual ([ final ])
                expect ( r[0] ).not.toBe ( final )
        }) // it Finish inside an array



    it ( 'Finish from a nested object callback under PASS', () => {
                const r = walk ({
                          data : { branch:{ before:1, final:{ number:2 }, after:3 }, later:{ number:4 } }
                        , objectCallback : ({ key, value, PASS, FINISH }) => {
                                              if ( key === 'branch' )   return PASS()
                                              if ( key === 'final' )   return FINISH ( 20 )
                                              return value
                                          }
                        , keyCallback : ({ value, isFinished }) => { expect ( isFinished ).toBe ( true ); return value + 1 }
                    })

                expect ( r ).toEqual ({ branch:{ before:1, final:21 }, later:{} })
        }) // it Finish under PASS



    it ( 'Finish from keyCallback after an object is replaced with a primitive', () => {
                const r = walk ({
                          data : { before:1, branch:{ number:2 }, after:3 }
                        , objectCallback : ({ key, value }) => key === 'branch' ? 20 : value
                        , keyCallback : ({ key, value, FINISH }) => key === 'branch' ? FINISH ( value + 1 ) : value
                    })

                expect ( r ).toEqual ({ before:1, branch:21 })
        }) // it Finish after an object replacement



    it ( 'Finish while visiting a container returned by keyCallback', () => {
                const visited = [];
                const r = walk ({
                          data : { branch:1, outside:2 }
                        , keyCallback : ({ key, value, FINISH }) => {
                                              visited.push ( key )
                                              if ( key === 'branch' )   return { first:3, after:4 }
                                              if ( key === 'first' )   return FINISH ( 30 )
                                              return value
                                          }
                    })

                expect ( r ).toEqual ({ branch:{ first:30 }, outside:2 })
                expect ( visited ).toEqual ([ 'branch', 'outside', 'first' ])
        }) // it Finish in a returned container



    it.each ([ false, true ]) ( 'Finish on a circular edge before further traversal (detectCycles: %s)', detectCycles => {
                const data = { number:1 }
                data.self = data
                data.after = 2
                const r = walk ({
                          data
                        , settings : { detectCycles }
                        , objectCallback : ({ key, value, FINISH }) => key === 'self' ? FINISH ( value ) : value
                    })

                expect ( r.number ).toBe ( 1 )
                expect ( r.self ).toBe ( data )
                expect ( Object.keys ( r ) ).toEqual ([ 'number', 'self' ])
        }) // it Finish on a circular edge



    it ( 'Keep finishing local to each walk and allow instruction reuse', () => {
                let saved
                const outer = walk ({
                          data : { first:1, second:2 }
                        , keyCallback : ({ value, FINISH }) => {
                                              const inner = walk ({ data:[3,4], keyCallback:({ value, FINISH }) => FINISH ( value ) })
                                              expect ( inner ).toEqual ([3])
                                              saved = FINISH ( value )
                                              return value
                                          }
                    })
                const stopped = walk ({ data:[10,20], keyCallback:() => saved })
                const next = walk ({ data:[30,40], keyCallback:({ value }) => value })

                expect ( outer ).toEqual ({ first:1, second:2 })
                expect ( stopped ).toEqual ([2])
                expect ( next ).toEqual ([30,40])
        }) // it Keep finishing local



    it ( 'Require returning the instruction rather than just calling FINISH', () => {
                const r = walk ({
                          data : { first:1, second:2 }
                        , objectCallback : ({ value, FINISH }) => { FINISH(); return value }
                        , keyCallback : ({ value, FINISH }) => { FINISH ( 100 ); return value }
                    })

                expect ( r ).toEqual ({ first:1, second:2 })
        }) // it Require returning the instruction



    it ( 'Treat an uncalled helper and instruction-like data as ordinary values', () => {
                let helper, instruction
                const ordinary = { hasValue:true, value:7 }
                const r = walk ({
                          data : { function:1, object:{} }
                        , objectCallback : ({ key, value, FINISH }) => {
                                              helper = FINISH
                                              instruction = FINISH ( 10 )
                                              return key === 'object' ? ordinary : value
                                          }
                        , keyCallback : ({ key, value, FINISH }) => key === 'function' ? FINISH : value
                    })

                expect ( r.function ).toBe ( helper )
                expect ( r.object ).toEqual ( ordinary )
                expect ( r.object ).not.toBe ( ordinary )
                expect ( Object.isFrozen ( instruction ) ).toBe ( true )
        }) // it Treat uncalled helpers and ordinary data as values

    it.each ([ 'keep', 'ignore', 'finish', 'omit' ]) ( 'Let keyCallback control a final object through isFinished: %s', action => {
                const data = { a:12, b:15, c:{ internal:44, in1:'bbb', in2:'ccc' }, after:55 }
                const visited = [];

                const r = walk ({
                          data
                        , objectCallback : ({ key, value, FINISH }) => key === 'c' ? FINISH ( value ) : value
                        , keyCallback : ({ key, value, isFinished, IGNORE, FINISH }) => {
                                              visited.push ({ key, isFinished })
                                              if ( !isFinished )   return value
                                              if ( action === 'ignore' )   return IGNORE()
                                              if ( action === 'finish' )   return FINISH ( value )
                                              if ( action === 'omit' )     return FINISH()
                                              return value
                                          }
                    })

                const final = action === 'keep' ? data.c : action === 'finish' ? { internal:44 } : {};
                expect ( r ).toEqual ({ a:12, b:15, c:final })
                expect ( visited.slice ( 0, 2 ) ).toEqual ([ { key:'a', isFinished:false }, { key:'b', isFinished:false } ])
                expect ( visited.slice ( 2 ).map ( entry => entry.key ) ).toEqual ( action === 'keep' || action === 'ignore' ? ['internal','in1','in2'] : ['internal'] )
                expect ( visited.slice ( 2 ).every ( entry => entry.isFinished ) ).toBe ( true )
                expect ( data.c ).toEqual ({ internal:44, in1:'bbb', in2:'ccc' })
        }) // it Let keyCallback control a final object



    it.each ([ true, false ]) ( 'Finish only the selected deep branch and skip its object callbacks (copy: %s)', copy => {
                const data = { queued:{ number:100 }, final:{ first:1, nested:{ number:2 }, list:[3,{ number:4 }] }, after:5 }
                const objects = [], keys = [];
                const r = walk ({
                          data
                        , settings : { copy }
                        , objectCallback : ({ key, value, FINISH }) => {
                                              objects.push ( key )
                                              return key === 'final' ? FINISH ( value ) : value
                                          }
                        , keyCallback : ({ value, breadcrumbs, parentPath, isFinished }) => {
                                              expect ( isFinished ).toBe ( true )
                                              keys.push ({ breadcrumbs, parentPath })
                                              return value * 10
                                          }
                    })

                expect ( objects ).toEqual ([ 'root', 'queued', 'final' ])
                expect ( keys ).toEqual ([
                          { breadcrumbs:'root/final/first', parentPath:['root','final'] }
                        , { breadcrumbs:'root/final/nested/number', parentPath:['root','final','nested'] }
                        , { breadcrumbs:'root/final/list/0', parentPath:['root','final','list'] }
                        , { breadcrumbs:'root/final/list/1/number', parentPath:['root','final','list','1'] }
                    ])
                if ( copy ) {
                        expect ( r ).toEqual ({ queued:{}, final:{ first:10, nested:{ number:20 }, list:[30,{ number:40 }] } })
                        expect ( r.final.nested ).not.toBe ( data.final.nested )
                    }
                else   expect ( r ).toBeUndefined()
                expect ( data.final ).toEqual ({ first:1, nested:{ number:2 }, list:[3,{ number:4 }] })
        }) // it Finish only the selected deep branch



    it ( 'Restart the final branch queue after previous jobs have completed', () => {
                const data = { first:{ number:1 }, second:{ queued:{ number:2 }, final:{ number:3 }, after:4 }, later:{ number:5 } }
                const seen = [];
                const r = walk ({
                          data
                        , objectCallback : ({ key, value, FINISH }) => key === 'final' ? FINISH ( value ) : value
                        , keyCallback : ({ value, isFinished }) => { seen.push ([ value, isFinished ]); return value * 10 }
                    })

                expect ( r ).toEqual ({ first:{ number:10 }, second:{ queued:{}, final:{ number:30 } }, later:{} })
                expect ( seen ).toEqual ([ [1,false], [3,true] ])
        }) // it Restart the final branch queue



    it.each ([ false, true ]) ( 'Finish a replacement root with keyCallback (array: %s)', array => {
                const replacement = array ? [1,{ number:2 }] : { number:1, nested:{ number:2 } }
                const r = walk ({
                          data : { original:100 }
                        , objectCallback : ({ key, FINISH }) => {
                                              expect ( key ).toBe ( 'root' )
                                              return FINISH ( replacement )
                                          }
                        , keyCallback : ({ value, isFinished }) => { expect ( isFinished ).toBe ( true ); return value + 1 }
                    })

                expect ( r ).toEqual ( array ? [2,{ number:3 }] : { number:2, nested:{ number:3 } } )
                expect ( r ).not.toBe ( replacement )
        }) // it Finish a replacement root



    it.each ([ true, false ]) ( 'Include final values directly without a keyCallback (copy: %s)', copy => {
                const data = { first:1, final:{ number:2 }, after:3 }
                const r = walk ({ data, settings:{ copy }, objectCallback:({ key, value, FINISH }) => key === 'final' ? FINISH ( value ) : value })
                const root = walk ({ data, settings:{ copy }, objectCallback:({ FINISH }) => FINISH ( data ) })

                if ( copy ) {
                        expect ( r ).toEqual ({ first:1, final:data.final })
                        expect ( r.final ).toBe ( data.final )
                        expect ( root ).toBe ( data )
                    }
                else {
                        expect ( r ).toBeUndefined()
                        expect ( root ).toBeUndefined()
                    }
        }) // it Include final values without a keyCallback



    it.each ([ undefined, null, false, 0, '', new Date() ]) ( 'Pass a final branch replaced with a simple value through keyCallback: %s', replacement => {
                const seen = [];
                const r = walk ({
                          data : { first:1, final:{ number:2 }, after:3 }
                        , objectCallback : ({ key, value, FINISH }) => key === 'final' ? FINISH ( replacement ) : value
                        , keyCallback : ({ value, isFinished }) => {
                                              seen.push ( isFinished )
                                              return isFinished ? 'last' : value
                                          }
                    })

                expect ( r ).toEqual ({ first:1, final:'last' })
                expect ( seen ).toEqual ([ false, true ])
        }) // it Pass a simple final branch through keyCallback



    it ( 'Visit containers returned by final key callbacks without object callbacks', () => {
                const r = walk ({
                          data : { final:{} , after:5 }
                        , objectCallback : ({ key, value, FINISH }) => {
                                              if ( key === 'final' )   return FINISH ({ generated:1 })
                                              expect ( key ).toBe ( 'root' )
                                              return value
                                          }
                        , keyCallback : ({ key, value, isFinished }) => {
                                              expect ( isFinished ).toBe ( true )
                                              return key === 'generated' ? { number:2 } : value * 10
                                          }
                    })

                expect ( r ).toEqual ({ final:{ generated:{ number:20 } } })
        }) // it Visit returned containers while finishing



    it ( 'Stop immediately from a final key callback and skip pending descendants', () => {
                const r = walk ({
                          data : { final:{ nested:{ number:1 }, stop:2, after:3 }, later:4 }
                        , objectCallback : ({ key, value, FINISH }) => key === 'final' ? FINISH ( value ) : value
                        , keyCallback : ({ value, FINISH, isFinished }) => { expect ( isFinished ).toBe ( true ); return FINISH() }
                    })

                expect ( r ).toEqual ({ final:{ nested:{} } })
        }) // it Stop immediately from a final key callback



    it ( 'Keep empty nested containers when all final leaves are ignored', () => {
                const r = walk ({
                          data : { final:{ number:1, nested:{ number:2 }, list:[3] }, after:4 }
                        , objectCallback : ({ key, value, FINISH }) => key === 'final' ? FINISH ( value ) : value
                        , keyCallback : ({ IGNORE, isFinished }) => { expect ( isFinished ).toBe ( true ); return IGNORE() }
                    })

                expect ( r ).toEqual ({ final:{ nested:{}, list:[] } })
        }) // it Keep empty nested containers



    it ( 'Process circular final branches through the usual cycle detection', () => {
                const final = { number:1 }
                final.self = final
                const r = walk ({
                          data : { final, after:2 }
                        , objectCallback : ({ key, value, FINISH }) => key === 'final' ? FINISH ( value ) : value
                        , keyCallback : ({ value, isFinished }) => { expect ( isFinished ).toBe ( true ); return value + 1 }
                    })

                expect ( Object.keys ( r ) ).toEqual ([ 'final' ])
                expect ( r.final.number ).toBe ( 2 )
                expect ( r.final.self ).toBe ( r.final )
        }) // it Process circular final branches



    it ( 'Keep deep ancestor lookups correct when finishing changes the pending queue', () => {
                let data = { final:{ number:1 }, later:{ number:2 } }
                for ( let index = 0; index < 40; index++ )   data = { child:data }
                const r = walk ({
                          data
                        , objectCallback : ({ key, value, FINISH }) => key === 'final' ? FINISH ( value ) : value
                        , keyCallback : ({ value, isFinished }) => { expect ( isFinished ).toBe ( true ); return value + 1 }
                    })
                let leaf = r;
                for ( let index = 0; index < 40; index++ )   leaf = leaf.child

                expect ( leaf ).toEqual ({ final:{ number:2 } })
        }) // it Keep deep ancestor lookups correct

    it.each ([ undefined, null, 5 ]) ( 'Keep simple final root replacements outside keyCallback: %s', value => {
                const r = walk ({
                          data : { original:1 }
                        , objectCallback : ({ FINISH }) => FINISH ( value )
                        , keyCallback : () => { throw new Error ( 'Simple root replacement reached keyCallback' ) }
                    })

                expect ( r ).toBe ( value )
        }) // it Keep simple final root replacements



    it ( 'Complete an empty final object without visiting pending work', () => {
                const data = { queued:{ number:1 }, final:{}, after:2 }
                const r = walk ({
                          data
                        , objectCallback : ({ key, value, FINISH }) => key === 'final' ? FINISH ( value ) : value
                        , keyCallback : () => { throw new Error ( 'No final leaves should exist' ) }
                    })

                expect ( r ).toEqual ({ queued:{}, final:{} })
                expect ( r.final ).not.toBe ( data.final )
        }) // it Complete an empty final object



    it ( 'Keep final-branch flags and stopping independent across nested walk calls', () => {
                const flags = [];
                const r = walk ({
                          data : { final:{ first:1, second:2 }, after:3 }
                        , objectCallback : ({ key, value, FINISH }) => key === 'final' ? FINISH ( value ) : value
                        , keyCallback : ({ value, isFinished }) => {
                                              flags.push ( isFinished )
                                              const inner = walk ({ data:[10,20], keyCallback:({ value, isFinished, FINISH }) => {
                                                                            expect ( isFinished ).toBe ( false )
                                                                            return FINISH ( value )
                                                                        } })
                                              expect ( inner ).toEqual ([10])
                                              return value
                                          }
                    })

                expect ( flags ).toEqual ([true,true])
                expect ( r ).toEqual ({ final:{ first:1, second:2 } })
        }) // it Keep final-branch flags independent

}) // describe
