"use strict"

import { describe, it, expect } from 'vitest'
import walk from '../src/main.js'
import { omitted, isContainer, generateData, objectRule, keyRule, reference, containers, freezeData } from './helpers/generated.js'



const seeds = Array.from ( { length:32 }, ( _, index ) => index + 1 );
const cases = [];
for ( const seed of seeds ) {
        for ( const circular of [ false, true ] ) {
                for ( const copy of [ false, true ] ) {
                        for ( const breadcrumbs of [ false, true ] ) {
                                for ( const parentPath of [ false, true ] ) {
                                        for ( const detectCycles of circular ? [ true ] : [ false, true ] )   cases.push ({ seed, circular, settings:{ copy, breadcrumbs, parentPath, detectCycles } })
                                    }
                            }
                    }
            }
    }



function checkContext ( context, settings ) {
    expect ( typeof context.key ).toBe ( 'string' )
    expect ( Object.hasOwn ( context, 'breadcrumbs' ) ).toBe ( settings.breadcrumbs )
    expect ( Object.hasOwn ( context, 'parentPath' ) ).toBe ( settings.parentPath )
    if ( settings.parentPath )   expect ( Object.isFrozen ( context.parentPath ) ).toBe ( true )
    if ( settings.breadcrumbs && settings.parentPath )   expect ([ ...context.parentPath, context.key ].join ( '/' )).toBe ( context.breadcrumbs )
} // checkContext func.



function record ( kind, context ) {
    return JSON.stringify ([ kind, context.key, context.breadcrumbs ?? null, context.parentPath ?? null, kind === 'key' ? context.isFinished : null ])
} // record func.



function checkGraph ( actual, expected ) {
    const matches = new Map(), used = new Set();
    function compare ( actual, expected ) {
        if ( !isContainer ( expected ) )   return expect ( actual ).toBe ( expected )
        if ( matches.has ( expected ) )   return expect ( actual ).toBe ( matches.get ( expected ) )
        expect ( isContainer ( actual ) ).toBe ( true )
        expect ( used.has ( actual ) ).toBe ( false )
        expect ( Array.isArray ( actual ) ).toBe ( Array.isArray ( expected ) )
        expect ( Object.keys ( actual ) ).toEqual ( Object.keys ( expected ) )
        if ( Array.isArray ( expected ) )   expect ( actual.length ).toBe ( expected.length )
        matches.set ( expected, actual )
        used.add ( actual )
        for ( const key of Object.keys ( expected ) )   compare ( actual[key], expected[key] )
    } // compare func.
    compare ( actual, expected )
} // checkGraph func.



function leafNumbers ( data ) {
    const values = [];
    function visit ( value ) {
        if ( !isContainer ( value ) )   return values.push ( value )
        for ( const key of Object.keys ( value ) )   visit ( value[key] )
    } // visit func.
    visit ( data )
    return values.sort (( a, b ) => a - b)
} // leafNumbers func.



function finalCopy ( data ) {
    if ( !isContainer ( data ) )   return typeof data === 'number' ? data + 1 : data
    const result = Array.isArray ( data ) ? [] : {};
    for ( const key of Object.keys ( data ) ) {
            if ( key === '_ignoredLeaf' )   continue
            const copied = finalCopy ( data[key] );
            const index = Number ( key );
            if ( Array.isArray ( result ) && Number.isInteger ( index ) && index >= 0 && index < 4294967295 && String ( index ) === key )   result.push ( copied )
            else   Object.defineProperty ( result, key, { value:copied, enumerable:true, configurable:true, writable:true } )
        }
    return result
} // finalCopy func.



describe ( 'Walk: generated structures', () => {

    it.each ( cases ) ( 'Match the independent reference: %j', ({ seed, circular, settings }) => {
                const data = freezeData ( generateData ( seed, circular ) );
                const snapshot = new Map ([ ...containers ( data ) ].map ( value => [ value, Object.getOwnPropertyDescriptors ( value ) ] ));
                const expected = reference ( data, seed, settings );
                const events = [];
                const extra = Object.freeze ({ seed });
                const r = walk ({
                          data
                        , settings
                        , objectCallback : ( context, received ) => {
                                              checkContext ( context, settings )
                                              expect ( received ).toBe ( extra )
                                              events.push ( record ( 'object', context ) )
                                              const decision = objectRule ( context.value, context.key, received.seed );
                                              if ( decision.kind === 'ignore' )   return context.IGNORE()
                                              if ( decision.kind === 'pass' )     return decision.value === context.value ? context.PASS() : context.PASS ( decision.value )
                                              return decision.value
                                          }
                        , keyCallback : ( context, received ) => {
                                              checkContext ( context, settings )
                                              expect ( received ).toBe ( extra )
                                              expect ( context.isFinished ).toBe ( false )
                                              events.push ( record ( 'key', context ) )
                                              const value = keyRule ( context.value, context.key, received.seed );
                                              return value === omitted ? context.IGNORE() : value
                                          }
                    }, extra )

                expect ( events.sort() ).toEqual ( expected.events )
                for ( const [ value, descriptors ] of snapshot )   expect ( Object.getOwnPropertyDescriptors ( value ) ).toEqual ( descriptors )
                if ( settings.copy ) {
                        checkGraph ( r, expected.result )
                        const sources = containers ( data );
                        for ( const value of containers ( r ) )   expect ( sources.has ( value ) ).toBe ( false )
                    }
                else    expect ( r ).toBeUndefined()
        }) // it Match the independent reference

}) // describe Walk: generated structures



describe ( 'Walk: generated FINISH cases', () => {

    it.each ( seeds ) ( 'Stop at a generated leaf, retaining only the visited prefix (seed: %s)', seed => {
                const data = freezeData ( generateData ( seed ) );
                const baseline = [];
                walk ({ data, keyCallback:({ value, breadcrumbs }) => { baseline.push ( breadcrumbs ); return value } })
                const stop = seed % baseline.length + 1;

                for ( const include of [ false, true ] ) {
                        for ( const copy of [ false, true ] ) {
                                const visited = [];
                                const r = walk ({
                                          data
                                        , settings : { copy }
                                        , keyCallback : ({ breadcrumbs, isFinished, FINISH }) => {
                                                              expect ( isFinished ).toBe ( false )
                                                              visited.push ( breadcrumbs )
                                                              if ( visited.length === stop )   return include ? FINISH ( stop ) : FINISH()
                                                              return visited.length
                                                          }
                                    })
                                expect ( visited ).toEqual ( baseline.slice ( 0, stop ) )
                                if ( copy )   expect ( leafNumbers ( r ) ).toEqual ( Array.from ( { length:include ? stop : stop - 1 }, ( _, index ) => index + 1 ) )
                                else          expect ( r ).toBeUndefined()
                            }
                    }
        }) // it Stop at a generated leaf



    it.each ( seeds ) ( 'Finish a generated branch after PASS, without further object callbacks (seed: %s)', seed => {
                const pending = freezeData ( generateData ( seed ) );
                const last = freezeData ( generateData ( seed + 32 ) );
                const array = seed % 2 === 0;
                const data = freezeData ( array ? [10,pending,last,99] : { outside:10, pending, last, after:99 } );
                const selected = array ? '2' : 'last';
                const rootPass = seed % 3 === 0;

                for ( const include of [ false, true ] ) {
                        for ( const copy of [ false, true ] ) {
                                for ( const paths of [ false, true ] ) {
                                        const settings = { copy, breadcrumbs:paths, parentPath:paths };
                                        const objects = [], flags = [];
                                        const r = walk ({
                                                  data
                                                , settings
                                                , objectCallback : ({ value, key, PASS, FINISH }) => {
                                                                      objects.push ( key )
                                                                      if ( key === selected )   return include ? FINISH ( value ) : FINISH()
                                                                      return key === 'root' && !rootPass ? value : PASS()
                                                                  }
                                                , keyCallback : context => {
                                                                      checkContext ( context, settings )
                                                                      flags.push ( context.isFinished )
                                                                      if ( context.key === '_ignoredLeaf' )   return context.IGNORE()
                                                                      return typeof context.value === 'number' ? context.value + 1 : context.value
                                                                  }
                                            })

                                        expect ( objects ).toEqual ( array ? ['root','1','2'] : ['root','pending','last'] )
                                        if ( !rootPass )   expect ( flags.shift() ).toBe ( false )
                                        expect ( flags.every ( flag => flag === true ) ).toBe ( true )
                                        if ( include )   expect ( flags.length ).toBeGreaterThan ( 0 )
                                        else             expect ( flags ).toEqual ( [] )
                                        if ( copy ) {
                                                const empty = Array.isArray ( pending ) ? [] : {};
                                                const expected = array ? [rootPass ? 10 : 11,empty] : { outside:rootPass ? 10 : 11, pending:empty };
                                                if ( include ) {
                                                        if ( array )   expected.push ( finalCopy ( last ) )
                                                        else           expected.last = finalCopy ( last )
                                                    }
                                                expect ( r ).toEqual ( expected )
                                            }
                                        else    expect ( r ).toBeUndefined()
                                    }
                            }
                    }
        }) // it Finish a generated branch

}) // describe Walk: generated FINISH cases
