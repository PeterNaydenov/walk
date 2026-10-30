"use strict"

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import walk from '../src/main.js'
import bundled from '../dist/walk.cjs'



const folder = fileURLToPath ( new URL ( '../skills/walk/', import.meta.url ) );
const entry = readFileSync ( join ( folder, 'SKILL.md' ), 'utf8' );
const examples = readFileSync ( join ( folder, 'references/examples.md' ), 'utf8' );
const snippets = [
          { heading:'Mask passwords', code:entry.match ( /```js\n([\s\S]*?)\n```/ )[1] }
        , ...[...examples.matchAll ( /^## ([^\n]+)\n\n```js\n([\s\S]*?)\n```/gm )].map ( match => ({ heading:match[1], code:match[2] }) )
    ];



/**
 *  Runs the documented examples against an implementation. The source and the
 *  shipped bundle are both checked. The bundle is what the consumers get and
 *  it is built separately from the source.
 */
function runExample ( code, implementation ) {
    const source = code.replace ( /^import .*\n/gm, '' );
    const body = `${source}\nreturn { result, data, paths:typeof paths === 'undefined' ? undefined : paths, found:typeof found === 'undefined' ? undefined : found }`;
    return new Function ( 'walk', body ) ( implementation )
} // runExample func.



describe.each ([ 'source', 'bundle' ]) ( 'Walk skill examples from the %s', origin => {

    const implementation = origin === 'bundle' ? bundled : walk;

    describe ( 'Walk: portable skill', () => {

        it ( 'Keep a short entrypoint, precise metadata, and four direct references', () => {
                    const metadata = entry.match ( /^---\n([\s\S]*?)\n---\n/ );
                    expect ( metadata ).not.toBeNull()
                    expect ( metadata[1] ).toMatch ( /^name: walk$/m )
                    const description = metadata[1].split ( 'description: >-\n' )[1].trim();
                    expect ( description.length ).toBeGreaterThan ( 0 )
                    expect ( description.length ).toBeLessThanOrEqual ( 1024 )
                    expect ( entry.slice ( metadata[0].length ).split ( '\n' ).length ).toBeLessThan ( 500 )
        }) // it Skill structure



        it ( 'Keep all reference examples independently runnable', () => {
                    expect ( snippets.length ).toBe ( 9 )
                    for ( const { code } of snippets )   expect ( code ).toContain ( "import walk from '@peter.naydenov/walk'" )
        }) // it Runnable example inventory



        it.each ( snippets ) ( '$heading', ({ heading, code }) => {
                    const { result, data } = runExample ( code, implementation );
                    switch ( heading ) {
                        case 'Mask passwords':
                            expect ( result ).toEqual ({ user:{ password:'[hidden]', name:'Peter' } })
                            expect ( data.user.password ).toBe ( 'secret' )
                            break
                        case 'Remove leaf keys':
                            expect ( result ).toEqual ({ name:'Peter', nested:{ count:2 } })
                            expect ( data.nested.token ).toBe ( 'abc' )
                            break
                        case 'Prune a whole branch':
                            expect ( result ).toEqual ({ profile:{ name:'Peter' } })
                            break
                        case 'PASS with a replacement':
                            expect ( result ).toEqual ({ branch:{ count:100, nested:{ count:6 } } })
                            expect ( data.branch.count ).toBe ( 2 )
                            break
                        case 'Inspect with a parent path':
                            expect ( result ).toBeUndefined()
                            break
                        case 'Stop at a matching leaf':
                            expect ( result ).toEqual ([12,22,33])
                            break
                        case 'Search without copying':
                            expect ( result ).toBeUndefined()
                            break
                        case 'Process a final branch':
                            expect ( result ).toEqual ({ a:12, c:{ internal:44 } })
                            break
                        case 'Copy circular and shared references':
                            expect ( result ).not.toBe ( data )
                            expect ( result.self ).toBe ( result )
                            expect ( result.a ).not.toBe ( result.b )
                            expect ( result.a ).toEqual ({ count:1 })
                            expect ( data.a ).toBe ( data.b )
                            break
                        default:
                            throw new Error ( 'Unchecked example: ' + heading )
                    }
            }) // it Example contract
    }) // describe Portable skill

}) // describe Source and bundle
