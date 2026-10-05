"use strict"

import { describe, it, expect } from 'vitest'
import walk from '../src/main.js'



describe ( 'Walk: circular references', () => {

    it ( 'Copy an object that refers to itself', () => {
                const data = { number:1 };
                data.self = data
                const r = walk ({ data })

                expect ( r ).not.toBe ( data )
                expect ( r.number ).toBe ( 1 )
                expect ( r.self ).toBe ( r )
                expect ( data.self ).toBe ( data )
        }) // it Copy an object that refers to itself



    it ( 'Copy an array that refers to itself and compact ignored indexes', () => {
                const data = [1];
                data.push ( data )
                const r = walk ({ data, keyCallback:({ IGNORE }) => IGNORE() })

                expect ( r ).not.toBe ( data )
                expect ( r ).toHaveLength ( 1 )
                expect ( r[0] ).toBe ( r )
                expect ( data[1] ).toBe ( data )
        }) // it Copy an array that refers to itself



    it.each ([ true, false ]) ( 'Preserve cycles through objects and arrays (copy: %s)', copy => {
                const data = { list:[] }, branch = { number:2 };
                data.list.push ( branch )
                branch.root = data
                branch.list = data.list
                const objects = [], keys = [];
                const r = walk ({
                          data
                        , settings : { copy }
                        , objectCallback : ({ value, breadcrumbs, parentPath, key }) => {
                                              objects.push ( breadcrumbs )
                                              expect ([ ...parentPath, key ].join ( '/' )).toBe ( breadcrumbs )
                                              return value
                                          }
                        , keyCallback : ({ value, breadcrumbs }) => {
                                              keys.push ( breadcrumbs )
                                              return value * 2
                                          }
                    })

                expect ( objects ).toEqual ([ 'root', 'root/list', 'root/list/0', 'root/list/0/root', 'root/list/0/list' ])
                expect ( keys ).toEqual ([ 'root/list/0/number' ])
                if ( copy ) {
                        expect ( r.list[0].root ).toBe ( r )
                        expect ( r.list[0].list ).toBe ( r.list )
                        expect ( r.list[0].number ).toBe ( 4 )
                    }
                else    expect ( r ).toBeUndefined()
        }) // it Preserve cycles through objects and arrays



    it ( 'Copy shared containers independently, including their own cycles', () => {
                const shared = { number:1 };
                shared.self = shared
                const data = { first:shared, second:shared }
                const r = walk ({ data })

                expect ( r.first ).not.toBe ( r.second )
                expect ( r.first ).not.toBe ( shared )
                expect ( r.second ).not.toBe ( shared )
                expect ( r.first.self ).toBe ( r.first )
                expect ( r.second.self ).toBe ( r.second )
        }) // it Copy shared containers independently



    it ( 'Restore the right ancestors when queued sibling branches share a cycle', () => {
                const first = { number:1 }, second = { number:2 };
                first.next = second
                second.next = first
                const r = walk ({ data:{ first, second } })

                expect ( r.first.next ).not.toBe ( r.second )
                expect ( r.second.next ).not.toBe ( r.first )
                expect ( r.first.next.next ).toBe ( r.first )
                expect ( r.second.next.next ).toBe ( r.second )
                expect ( r.first.next.number ).toBe ( 2 )
                expect ( r.second.next.number ).toBe ( 1 )
        }) // it Restore the right ancestors



    it.each ([ true, false ]) ( 'Detect cycles without either path argument (copy: %s)', copy => {
                const data = { number:1 };
                data.self = data
                const objects = [], keys = [];
                const r = walk ({
                          data
                        , settings : { copy, breadcrumbs:false, parentPath:false }
                        , objectCallback : context => {
                                              expect ( context ).not.toHaveProperty ( 'breadcrumbs' )
                                              expect ( context ).not.toHaveProperty ( 'parentPath' )
                                              objects.push ( context.key )
                                              return context.value
                                          }
                        , keyCallback : ({ value, key }) => { keys.push ( key ); return value }
                    })

                expect ( objects ).toEqual ([ 'root', 'self' ])
                expect ( keys ).toEqual ([ 'number' ])
                if ( copy )    expect ( r.self ).toBe ( r )
                else           expect ( r ).toBeUndefined()
        }) // it Detect cycles without either path argument



    it ( 'IGNORE or replace a circular edge before linking it', () => {
                const data = { number:1 };
                data.remove = data
                data.simple = data
                data.branch = data
                const keys = []
                const r = walk ({
                          data
                        , objectCallback : ({ value, key, IGNORE }) => {
                                              if ( key === 'remove' )   return IGNORE()
                                              if ( key === 'simple' )   return 2
                                              if ( key === 'branch' )   return { number:3 }
                                              return value
                                          }
                        , keyCallback : ({ value, breadcrumbs }) => { keys.push ( breadcrumbs ); return value * 2 }
                    })

                expect ( r ).toEqual ({ number:2, simple:4, branch:{ number:6 } })
                expect ( keys ).toEqual ([ 'root/number', 'root/simple', 'root/branch/number' ])
        }) // it IGNORE or replace a circular edge



    it.each ([ true, false ]) ( 'Handle PASS on a circular root and branch (copy: %s)', copy => {
                const data = { number:1, nested:{ number:2 } };
                data.self = data
                data.nested.parent = data
                const keys = []
                const r = walk ({
                          data
                        , settings : { copy }
                        , objectCallback : ({ value, key, PASS }) => key === 'nested' ? value : PASS()
                        , keyCallback : ({ value, key }) => { keys.push ( key ); return value * 2 }
                    })

                expect ( keys ).toEqual ([ 'number' ])
                if ( copy ) {
                        expect ( r.number ).toBe ( 1 )
                        expect ( r.nested.number ).toBe ( 4 )
                        expect ( r.self ).toBe ( r )
                        expect ( r.nested.parent ).toBe ( r )
                    }
                else    expect ( r ).toBeUndefined()
        }) // it Handle PASS on a circular root and branch



    it.each ([ true, false ]) ( 'Link ancestor containers returned by either callback (copy: %s)', copy => {
                const data = { number:1, nested:{} }
                const r = walk ({
                          data
                        , settings : { copy }
                        , objectCallback : ({ value, key, PASS }) => key === 'nested' ? PASS ( data ) : value
                        , keyCallback : () => data
                    })

                if ( copy ) {
                        expect ( r.number ).toBe ( r )
                        expect ( r.nested ).toBe ( r )
                    }
                else    expect ( r ).toBeUndefined()
        }) // it Link ancestor containers returned by either callback



    it ( 'Detect cycles in replacement roots and containers returned by keyCallback', () => {
                const replacement = [], returned = { number:2 };
                replacement.push ( 1, replacement )
                returned.self = returned
                const r = walk ({
                          data : {}
                        , objectCallback : ({ value, key }) => key === 'root' ? replacement : value
                        , keyCallback : ({ value, key }) => key === '0' ? returned : value
                    })

                expect ( r[1] ).toBe ( r )
                expect ( r[0].self ).toBe ( r[0] )
                expect ( r[0].number ).toBe ( 2 )
                expect ( r[0] ).not.toBe ( returned )
        }) // it Detect cycles in replacement roots and containers



    it.each ([ true, false ]) ( 'Keep deep sibling ancestors separate when paths are disabled (copy: %s)', copy => {
                const first = {}, second = {}, data = [first,second], shared = { number:3 };
                let left = first, right = second;
                shared.self = shared
                for ( let index = 0; index < 64; index++ ) {
                        left.next = {}
                        right.next = {}
                        left = left.next
                        right = right.next
                    }
                left.number = 1
                right.number = 2
                left.root = right.root = data
                left.parent = first
                right.parent = second
                left.shared = right.shared = shared
                const keys = []
                const r = walk ({
                          data
                        , settings : { copy, breadcrumbs:false, parentPath:false }
                        , objectCallback : ({ value }) => value
                        , keyCallback : ({ value }) => { keys.push ( value ); return value }
                    })

                expect ( keys ).toEqual ([ 1,2,3,3 ])
                if ( copy ) {
                        left = r[0]
                        right = r[1]
                        for ( let index = 0; index < 64; index++ ) {
                                left = left.next
                                right = right.next
                            }
                        expect ( left.root ).toBe ( r )
                        expect ( right.root ).toBe ( r )
                        expect ( left.parent ).toBe ( r[0] )
                        expect ( right.parent ).toBe ( r[1] )
                        expect ( left.shared ).not.toBe ( right.shared )
                        expect ( left.shared.self ).toBe ( left.shared )
                        expect ( right.shared.self ).toBe ( right.shared )
                    }
                else    expect ( r ).toBeUndefined()
        }) // it Keep deep sibling ancestors separate



    it ( 'Keep ancestor tracking local to each walk call', () => {
                const data = { number:1 };
                data.self = data
                const inner = [], context = { increment:1 };
                const r = walk ({
                          data
                        , keyCallback : ({ value }, received) => {
                                              expect ( received ).toBe ( context )
                                              inner.push ( walk ({ data }) )
                                              return value + received.increment
                                          }
                    }, context )

                expect ( r.self ).toBe ( r )
                expect ( r.number ).toBe ( 2 )
                expect ( inner ).toHaveLength ( 1 )
                expect ( inner[0].self ).toBe ( inner[0] )
                expect ( inner[0] ).not.toBe ( r )
        }) // it Keep ancestor tracking local

}) // describe Walk: circular references



describe ( 'Walk: settings.detectCycles', () => {

    it.each ([ undefined, true, null, 0, '', 'false' ]) ( 'Only literal false disables detection: %s', detectCycles => {
                const data = { number:1 };
                data.self = data
                const settings = Object.freeze ({ detectCycles })
                const r = walk ({ data, settings })

                expect ( r.self ).toBe ( r )
                expect ( r ).not.toBe ( data )
                expect ( settings ).toEqual ({ detectCycles })
        }) // it Only literal false disables detection



    it.each ([ true, false ]) ( 'Let callbacks bound repeated visits when detection is disabled (copy: %s)', copy => {
                const data = { number:1 };
                data.self = data
                let objects = 0, keys = 0;
                const r = walk ({
                          data
                        , settings : { copy, detectCycles:false }
                        , objectCallback : ({ value, IGNORE }) => ++objects === 4 ? IGNORE() : value
                        , keyCallback : ({ value }) => { keys++; return value }
                    })

                expect ( objects ).toBe ( 4 )
                expect ( keys ).toBe ( 3 )
                if ( copy ) {
                        expect ( r ).toEqual ({ number:1, self:{ number:1, self:{ number:1 } } })
                        expect ( r.self ).not.toBe ( r )
                        expect ( r.self.self ).not.toBe ( r.self )
                    }
                else    expect ( r ).toBeUndefined()
                expect ( data.self ).toBe ( data )
        }) // it Let callbacks bound repeated visits



    it.each ([
              { copy:true,  breadcrumbs:true,  parentPath:true  }
            , { copy:false, breadcrumbs:true,  parentPath:true  }
            , { copy:true,  breadcrumbs:false, parentPath:true  }
            , { copy:false, breadcrumbs:false, parentPath:true  }
            , { copy:true,  breadcrumbs:true,  parentPath:false }
            , { copy:false, breadcrumbs:true,  parentPath:false }
            , { copy:true,  breadcrumbs:false, parentPath:false }
            , { copy:false, breadcrumbs:false, parentPath:false }
        ]) ( 'Preserve callbacks, replacements, and other settings without detection: %j', settings => {
                const data = { outside:1, branch:{ number:2, nested:{ number:3 } }, skip:{ number:4 }, expand:5 }
                const extra = { multiplier:2 }

                function visit ( detectCycles ) {
                    const events = []
                    function record ( kind, context, received ) {
                        expect ( received ).toBe ( extra )
                        expect ( Object.hasOwn ( context, 'breadcrumbs' ) ).toBe ( settings.breadcrumbs )
                        expect ( Object.hasOwn ( context, 'parentPath' ) ).toBe ( settings.parentPath )
                        events.push ({ kind, key:context.key, breadcrumbs:context.breadcrumbs, parentPath:context.parentPath })
                    } // record func.

                    const result = walk ({
                              data
                            , settings : { ...settings, detectCycles }
                            , objectCallback : ( context, received ) => {
                                                  record ( 'object', context, received )
                                                  const { value, key, PASS, IGNORE } = context;
                                                  if ( key === 'branch' )   return PASS ({ ...value, number:100 })
                                                  if ( key === 'skip' )     return IGNORE()
                                                  if ( key === 'nested' )   return { number:30 }
                                                  return value
                                              }
                            , keyCallback : ( context, received ) => {
                                                  record ( 'key', context, received )
                                                  if ( context.key === 'expand' )   return [{ number:6 },7]
                                                  return context.value * received.multiplier
                                              }
                        }, extra )
                    return { result, events }
                } // visit func.

                const enabled = visit ( true ), disabled = visit ( false );
                expect ( disabled ).toEqual ( enabled )
                expect ( disabled.events.map (({ kind, key }) => `${kind}:${key}`) ).toEqual ([
                          'object:root', 'key:outside', 'object:branch', 'object:skip', 'key:expand'
                        , 'object:nested', 'object:0', 'key:1', 'key:number', 'key:number'
                    ])
                if ( settings.copy )    expect ( disabled.result ).toEqual ({ outside:2, branch:{ number:100, nested:{ number:60 } }, expand:[{ number:12 },14] })
                else                    expect ( disabled.result ).toBeUndefined()
                expect ( data ).toEqual ({ outside:1, branch:{ number:2, nested:{ number:3 } }, skip:{ number:4 }, expand:5 })
        }) // it Preserve callbacks and other settings



    it.each ([ true, false ]) ( 'Walk deep shared containers independently without detection (copy: %s)', copy => {
                const shared = { number:1 };
                let data = { first:shared, second:shared };
                for ( let index = 0; index < 4000; index++ )   data = { child:data }
                const keys = []
                const r = walk ({
                          data
                        , settings : { copy, detectCycles:false, breadcrumbs:false, parentPath:false }
                        , keyCallback : ({ value }) => { keys.push ( value ); return value + 1 }
                    })

                expect ( keys ).toEqual ([ 1,1 ])
                if ( copy ) {
                        let result = r;
                        for ( let index = 0; index < 4000; index++ )   result = result.child
                        expect ( result ).toEqual ({ first:{ number:2 }, second:{ number:2 } })
                        expect ( result.first ).not.toBe ( result.second )
                        expect ( result.first ).not.toBe ( shared )
                    }
                else    expect ( r ).toBeUndefined()
                expect ( shared.number ).toBe ( 1 )
        }) // it Walk deep shared containers independently

}) // describe Walk: settings.detectCycles
