"use strict"

import { describe, it, expect } from 'vitest'
import walk from '../src/main.js'



describe ( 'Walk: settings and parentPath', () => {

    it ( 'Skip reading path settings without callbacks', () => {
                const data = { nested:{ number:1 } }
                const settings = {
                          get breadcrumbs () { throw new Error ( 'Breadcrumbs are only needed by callbacks' ) }
                        , get parentPath () { throw new Error ( 'Parent paths are only needed by callbacks' ) }
                    }

                expect ( walk ({ data, settings }) ).toEqual ( data )
        }) // it Skip reading path settings without callbacks



    it ( 'Build both paths by default, including the root callback', () => {
                const visited = []
                const data = { name:'Peter', nested:{ age:47 } }

                function callback ( context ) {
                            const { key, breadcrumbs, parentPath } = context;
                            visited.push ({ key, breadcrumbs, parentPath })
                            return context.value
                      }

                const r = walk ({ data, keyCallback:callback, objectCallback:callback })

                expect ( r ).toEqual ( data )
                expect ( visited ).toEqual ([
                          { key:'root', breadcrumbs:'root', parentPath:[] }
                        , { key:'name', breadcrumbs:'root/name', parentPath:['root'] }
                        , { key:'nested', breadcrumbs:'root/nested', parentPath:['root'] }
                        , { key:'age', breadcrumbs:'root/nested/age', parentPath:['root','nested'] }
                    ])
                expect ( visited[1].parentPath ).toBe ( visited[2].parentPath )
        }) // it Build both paths by default



    it.each ([
              { breadcrumbs:true,  parentPath:true  }
            , { breadcrumbs:true,  parentPath:false }
            , { breadcrumbs:false, parentPath:true  }
            , { breadcrumbs:false, parentPath:false }
        ]) ( 'Apply metadata settings to both callbacks: %j', settings => {
                let calls = 0
                const extra = { multiplier:2 }

                function check ( context, received ) {
                            expect ( received ).toBe ( extra )
                            expect ( Object.hasOwn ( context, 'breadcrumbs' ) ).toBe ( settings.breadcrumbs )
                            expect ( Object.hasOwn ( context, 'parentPath'  ) ).toBe ( settings.parentPath )
                            expect ( typeof context.IGNORE ).toBe ( 'function' )
                            if ( settings.breadcrumbs )   expect ( typeof context.breadcrumbs ).toBe ( 'string' )
                            if ( settings.parentPath  )   expect ( Array.isArray ( context.parentPath ) ).toBe ( true )
                            calls++
                      }

                const r = walk ({
                          data : { nested:{ number:2 }, list:[3] }
                        , settings
                        , objectCallback : ( context, received ) => {
                                              check ( context, received )
                                              expect ( typeof context.PASS ).toBe ( 'function' )
                                              return context.value
                                          }
                        , keyCallback : ( context, received ) => {
                                              check ( context, received )
                                              return context.value * received.multiplier
                                          }
                    }, extra )

                expect ( r ).toEqual ({ nested:{ number:4 }, list:[6] })
                expect ( calls ).toBe ( 5 )
        }) // it Apply metadata settings to both callbacks



    it.each ([ {}, { breadcrumbs:false }, { parentPath:false } ]) ( 'Unspecified settings remain enabled: %j', settings => {
                walk ({
                          data : { number:1 }
                        , settings
                        , keyCallback : context => {
                                              expect ( Object.hasOwn ( context, 'breadcrumbs' ) ).toBe ( settings.breadcrumbs !== false )
                                              expect ( Object.hasOwn ( context, 'parentPath'  ) ).toBe ( settings.parentPath !== false )
                                              return context.value
                                          }
                    })
        }) // it Unspecified settings remain enabled



    it.each ([ undefined, null, 0, '', true ]) ( 'Only literal false disables metadata, not %s', setting => {
                walk ({
                          data : { number:1 }
                        , settings : { breadcrumbs:setting, parentPath:setting }
                        , keyCallback : ({ value, breadcrumbs, parentPath }) => {
                                              expect ( breadcrumbs ).toBe ( 'root/number' )
                                              expect ( parentPath ).toEqual ([ 'root' ])
                                              return value
                                          }
                    })
        }) // it Only literal false disables metadata



    it ( 'Keep the provided settings unchanged', () => {
                const settings = Object.freeze ({ parentPath:false })
                const r = walk ({ data:{ number:1 }, settings, keyCallback:({ value }) => value })

                expect ( r ).toEqual ({ number:1 })
                expect ( settings ).toEqual ({ parentPath:false })
        }) // it Keep the provided settings unchanged



    it ( 'Preserve property boundaries when parent names contain slashes', () => {
                const paths = []
                const breadcrumbs = []

                walk ({
                          data : { 'a/b':{ c:1 }, a:{ b:{ c:2 } } }
                        , keyCallback : ({ value, parentPath, key, breadcrumbs:br }) => {
                                              paths.push ([ ...parentPath, key ])
                                              breadcrumbs.push ( br )
                                              return value
                                          }
                    })

                expect ( paths ).toEqual ([ ['root','a/b','c'], ['root','a','b','c'] ])
                expect ( breadcrumbs ).toEqual ([ 'root/a/b/c', 'root/a/b/c' ])
        }) // it Preserve property boundaries



    it ( 'Protect shared parent paths from callback mutation', () => {
                const paths = []

                walk ({
                          data : { first:1, second:2 }
                        , keyCallback : ({ value, parentPath }) => {
                                              expect ( () => parentPath.push ( 'changed' ) ).toThrow ( TypeError )
                                              paths.push ( parentPath )
                                              return value
                                          }
                    })

                expect ( paths ).toEqual ([ ['root'], ['root'] ])
                expect ( paths[0] ).toBe ( paths[1] )
        }) // it Protect shared parent paths



    it ( 'Use input array indexes in paths when ignored elements compact the output', () => {
                const visited = []

                const r = walk ({
                          data : [{ drop:true }, { number:2 }]
                        , objectCallback : ({ value, IGNORE }) => value.drop ? IGNORE() : value
                        , keyCallback : ({ value, key, parentPath }) => {
                                              visited.push ({ key, parentPath })
                                              return value
                                          }
                    })

                expect ( r ).toEqual ([ { number:2 } ])
                expect ( visited ).toEqual ([ { key:'number', parentPath:['root','1'] } ])
        }) // it Use input array indexes in paths



    it ( 'Carry paths through structures returned by both callbacks', () => {
                const visited = []

                const r = walk ({
                          data : { fromKey:1, fromObject:{} }
                        , keyCallback : ({ value, key, breadcrumbs, parentPath }) => {
                                              if ( key === 'fromKey' )   return { child:[2] }
                                              visited.push ({ key, breadcrumbs, parentPath })
                                              return value
                                          }
                        , objectCallback : ({ value, key }) => key === 'fromObject' ? { child:[3] } : value
                    })

                expect ( r ).toEqual ({ fromKey:{ child:[2] }, fromObject:{ child:[3] } })
                expect ( visited ).toEqual ([
                          { key:'0', breadcrumbs:'root/fromKey/child/0', parentPath:['root','fromKey','child'] }
                        , { key:'0', breadcrumbs:'root/fromObject/child/0', parentPath:['root','fromObject','child'] }
                    ])
        }) // it Carry paths through returned structures



    it ( 'Copy a deeply nested structure with both paths disabled', () => {
                let data = { number:1 }
                for ( let i = 0; i < 4000; i++ )   data = { child:data }

                const r = walk ({
                          data
                        , settings : { breadcrumbs:false, parentPath:false }
                        , keyCallback : ({ value }) => value + 1
                    })

                let original = data, copied = r;
                for ( let i = 0; i < 4000; i++ ) {
                            expect ( copied !== original ).toBe ( true )
                            original = original.child
                            copied = copied.child
                      }
                expect ( copied.number ).toBe ( 2 )
                expect ( original.number ).toBe ( 1 )
        }) // it Copy a deeply nested structure with both paths disabled

}) // describe
