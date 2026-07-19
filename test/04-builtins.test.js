"use strict"

import { describe, it, expect } from 'vitest'
import walk from '../src/main.js'



// ============================================================================
// Regression: built-in object types (Date, RegExp, Map, Set, typed arrays,
// ArrayBuffer, DataView, WeakMap, WeakSet) used to be classified as a plain
// `object` by `findType`. Since their data lives outside the
// own-enumerable-string-key model that `walk` uses, the result was an empty
// `{}` and the original value was lost. They are now classified as `simple`
// and preserved by reference — same contract as `function` and DOM nodes.
// ============================================================================

describe ( 'Walk: built-in object types', () => {

    it ( 'Date at top level is preserved by reference', () => {
        const d = new Date ( '2024-01-15' )
        const r = walk ({ data: d })
        expect ( r ).toBe ( d )            // same reference, not a copy
    })


    it ( 'Date as a property value is preserved by reference', () => {
        const x = { name: 'Peter', birthday: new Date ( '1990-05-12' ) }
        const r = walk ({ data: x })
        expect ( r.birthday ).toBe ( x.birthday )
    })


    it ( 'Date inside an array is preserved by reference', () => {
        const dates = [ new Date ( '2020-01-01' ), new Date ( '2021-01-01' ) ]
        const r = walk ({ data: { list: dates } })
        expect ( r.list[0] ).toBe ( dates[0] )
        expect ( r.list[1] ).toBe ( dates[1] )
    })


    it ( 'RegExp at top level is preserved by reference', () => {
        const re = /abc/gi
        const r = walk ({ data: re })
        expect ( r ).toBe ( re )
    })


    it ( 'RegExp as a property value is preserved by reference', () => {
        const x = { pattern: /^test$/i }
        const r = walk ({ data: x })
        expect ( r.pattern ).toBe ( x.pattern )
    })


    it ( 'Map at top level is preserved by reference', () => {
        const m = new Map ([ [ 'a', 1 ], [ 'b', 2 ] ])
        const r = walk ({ data: m })
        expect ( r ).toBe ( m )
    })


    it ( 'Map as a property value is preserved by reference (data intact)', () => {
        const x = { name: 'Peter', scores: new Map ([ [ 'math', 95 ], [ 'art', 88 ] ]) }
        const r = walk ({ data: x })
        expect ( r.scores ).toBe ( x.scores )             // same reference
        expect ( r.scores.get ( 'math' ) ).toBe ( 95 )    // data still works
        expect ( r.scores.get ( 'art'  ) ).toBe ( 88 )
    })


    it ( 'Set at top level is preserved by reference', () => {
        const s = new Set ([ 1, 2, 3 ])
        const r = walk ({ data: s })
        expect ( r ).toBe ( s )
    })


    it ( 'Set as a property value is preserved by reference', () => {
        const x = { tags: new Set ([ 'js', 'ts' ]) }
        const r = walk ({ data: x })
        expect ( r.tags ).toBe ( x.tags )
        expect ( r.tags.has ( 'js' ) ).toBe ( true )
    })


    it ( 'WeakMap at top level is preserved by reference', () => {
        const wm = new WeakMap ()
        const key = {}
        wm.set ( key, 'value' )
        const r = walk ({ data: wm })
        expect ( r ).toBe ( wm )
        expect ( r.get ( key ) ).toBe ( 'value' )
    })


    it ( 'WeakSet at top level is preserved by reference', () => {
        const ws = new WeakSet ()
        const obj = {}
        ws.add ( obj )
        const r = walk ({ data: ws })
        expect ( r ).toBe ( ws )
        expect ( r.has ( obj ) ).toBe ( true )
    })


    it ( 'ArrayBuffer at top level is preserved by reference', () => {
        const buf = new ArrayBuffer ( 8 )
        const r = walk ({ data: buf })
        expect ( r ).toBe ( buf )
    })


    it ( 'DataView at top level is preserved by reference', () => {
        const buf = new ArrayBuffer ( 8 )
        const dv  = new DataView ( buf )
        const r = walk ({ data: dv })
        expect ( r ).toBe ( dv )
        expect ( r.byteLength ).toBe ( 8 )
    })


    it ( 'Uint8Array at top level is preserved by reference (not converted to plain object)', () => {
        const u = new Uint8Array ([ 1, 2, 3 ])
        const r = walk ({ data: u })
        expect ( r ).toBe ( u )                          // same reference, not a plain-object copy
        expect ( r instanceof Uint8Array ).toBe ( true ) // still a typed array
    })


    it ( 'Float32Array as a property value is preserved by reference', () => {
        const x = { values: new Float32Array ([ 1.5, 2.5 ]) }
        const r = walk ({ data: x })
        expect ( r.values ).toBe ( x.values )
        expect ( r.values instanceof Float32Array ).toBe ( true )
    })


    it ( 'Object callback is not called on a simple-type root (Date)', () => {
        let called = false
        const r = walk ({
                  data: new Date ( '2024-01-15' )
                , objectCallback: () => { called = true; return undefined }
            })
        expect ( called ).toBe ( false )   // root was a Date, objectCallback is for objects/arrays only
    })


    it ( 'Built-in nested inside an array survives both callbacks', () => {
        const x = [ new Date ( '2020-01-01' ), new Map ([ [ 'k', 'v' ] ]), 42 ]
        const r = walk ({
                  data: x
                , objectCallback: ({ value, key }) => key === 'root' ? value : value
                , keyCallback    : ({ value }) => value
            })
        expect ( r[0] ).toBe ( x[0] )
        expect ( r[1] ).toBe ( x[1] )
        expect ( r[2] ).toBe ( 42 )
    })

}) // describe
