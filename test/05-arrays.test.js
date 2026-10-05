"use strict"

import { describe, it, expect } from 'vitest'
import { runInNewContext } from 'node:vm'
import walk from '../src/main.js'

const nonIndexKeys = [ '-1', '-0', '01', '1.5', '1e2', '+1', '', ' ', '0x10', 'Infinity', 'NaN', '4294967295', '4294967296' ]

describe ( 'Walk: array recognition and properties', () => {

    it.each ([ false, true ]) ( 'Copy arrays from another context (callbacks: %s)', useCallbacks => {
        const data = runInNewContext ( '[ 1, [ 2 ], { list: [ 3 ] } ]' )
        expect ( data instanceof Array ).toBe ( false )
        const options = { data }
        if ( useCallbacks ) {
            options.keyCallback = ({ value }) => value
            options.objectCallback = ({ value }) => value
        }

        const r = walk ( options )

        expect ( Array.isArray ( r ) ).toBe ( true )
        expect ( Array.isArray ( r[1] ) ).toBe ( true )
        expect ( Array.isArray ( r[2].list ) ).toBe ( true )
        expect ( r ).toEqual ([ 1, [ 2 ], { list: [ 3 ] } ])
        expect ( r ).not.toBe ( data )
        expect ( r[1] ).not.toBe ( data[1] )
        expect ( r[2].list ).not.toBe ( data[2].list )
    })

    it ( 'Copy a nested array from another context', () => {
        const list = runInNewContext ( '[ 1, 2 ]' )
        const r = walk ({ data: { list } })

        expect ( Array.isArray ( r.list ) ).toBe ( true )
        expect ( r.list ).toEqual ([ 1, 2 ])
        expect ( r.list ).not.toBe ( list )
    })

    it ( 'Walk into an array from another context returned by keyCallback', () => {
        const list = runInNewContext ( '[ 1, 2 ]' )
        const r = walk ({
            data: { list: 'placeholder' },
            keyCallback: ({ key, value }) => key === 'list' ? list : value * 10
        })

        expect ( Array.isArray ( r.list ) ).toBe ( true )
        expect ( r.list ).toEqual ([ 10, 20 ])
        expect ( r.list ).not.toBe ( list )
    })

    it.each ([ 'root', 'list' ]) ( 'Walk into an array from another context returned by objectCallback at %s', location => {
        const list = runInNewContext ( '[ 1, 2 ]' )
        const r = walk ({
            data: location === 'root' ? {} : { list: {} },
            objectCallback: ({ key, value }) => key === location ? list : value,
            keyCallback: ({ value }) => value * 10
        })
        const copiedList = location === 'root' ? r : r.list

        expect ( Array.isArray ( copiedList ) ).toBe ( true )
        expect ( copiedList ).toEqual ([ 10, 20 ])
        expect ( copiedList ).not.toBe ( list )
    })

    const propertyCases = [
        { name: 'primitive', value: 3, expected: 3 },
        { name: 'transformed primitive', value: 3, expected: 6,
          keyCallback: ({ key, value }) => nonIndexKeys.includes ( key ) ? value * 2 : value },
        { name: 'primitive replaced by object', value: 3, expected: { leaf: 3 },
          keyCallback: ({ key, value }) => nonIndexKeys.includes ( key ) ? { leaf: value } : value },
        { name: 'primitive replaced by array', value: 3, expected: [ 3 ],
          keyCallback: ({ key, value }) => nonIndexKeys.includes ( key ) ? [ value ] : value },
        { name: 'object', value: { leaf: 3 }, expected: { leaf: 3 },
          objectCallback: ({ value }) => value },
        { name: 'array', value: [ 3 ], expected: [ 3 ] },
        { name: 'object replaced by primitive', value: { leaf: 3 }, expected: 3,
          objectCallback: ({ key, value }) => nonIndexKeys.includes ( key ) ? value.leaf : value }
    ]

    it.each ( propertyCases ) ( 'Preserve non-index property names: $name', ({ value, expected, keyCallback, objectCallback }) => {
        const data = [ 10 ]
        nonIndexKeys.forEach ( key => { data[key] = value } )

        const r = walk ({ data, keyCallback, objectCallback })

        expect ( r ).toHaveLength ( 1 )
        expect ( r[0] ).toBe ( 10 )
        expect ( Object.keys ( r ) ).toEqual ( Object.keys ( data ) )
        nonIndexKeys.forEach ( key => {
            expect ( r[key] ).toEqual ( expected )
            if ( value !== null && typeof value === 'object' )   expect ( r[key] ).not.toBe ( value )
        })
    })

    it ( 'Compact retained indexes while keeping additional properties at their own keys', () => {
        const data = [ { drop: true }, 10, [ 20 ] ]
        data['-1'] = { keep: true }
        data['01'] = 30

        const r = walk ({
            data,
            objectCallback: ({ value, IGNORE }) => value.drop ? IGNORE() : value
        })

        expect ( r ).toHaveLength ( 2 )
        expect ( r[0] ).toBe ( 10 )
        expect ( r[1] ).toEqual ([ 20 ])
        expect ( r['-1'] ).toEqual ({ keep: true })
        expect ( r['-1'] ).not.toBe ( data['-1'] )
        expect ( r['01'] ).toBe ( 30 )
    })

    it ( 'Distinguish the largest array index from the first numeric non-index property', () => {
        const data = []
        data['4294967294'] = 'element'
        data['4294967295'] = 'property'

        const r = walk ({ data })

        expect ( r ).toHaveLength ( 1 )
        expect ( r[0] ).toBe ( 'element' )
        expect ( r['4294967295'] ).toBe ( 'property' )
        expect ( Object.keys ( r ) ).toEqual ([ '0', '4294967295' ])
    })

})
