"use strict"

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, mkdirSync, symlinkSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import { join } from 'node:path'



/**
 *  Type-checks small consumer files against the package as it is published:
 *  through its name, its `exports` conditions, and its declaration files.
 *  Every file also contains a deliberate mistake under `@ts-expect-error`.
 *  If the editor types stopped resolving, that mistake would no longer be
 *  reported and tsc would fail on the unused directive.
 */
const root = fileURLToPath ( new URL ( '..', import.meta.url ) );
const tsc  = join ( root, 'node_modules', '.bin', 'tsc' );
const consumers = {
          'package.json' : JSON.stringify ({ name:'walk-consumer', type:'module' })
        , 'tsconfig.json' : JSON.stringify ({
                      compilerOptions : { module:'nodenext', moduleResolution:'nodenext', strict:true, noEmit:true, allowJs:true, checkJs:true, preserveSymlinks:true, types:[] }
                    , include : [ '*.mts', '*.cts', '*.js', '*.cjs' ]
                })
        , 'esm.mts' : `
import walk, { type Settings, type Options, type KeyCallback, type ObjectCallback } from '@peter.naydenov/walk'
import bundled from '@peter.naydenov/walk/dist/walk.esm.mjs'

const settings : Settings = { copy:false, breadcrumbs:false, parentPath:false, detectCycles:false }
const keyCallback : KeyCallback = ({ value, key, breadcrumbs, parentPath, IGNORE, FINISH, isFinished }) => key === 'skip' ? IGNORE() : value
const objectCallback : ObjectCallback = ({ value, PASS, FINISH }) => PASS ( value )
const options : Options = { data:{}, keyCallback, objectCallback, settings }

walk ( options )
walk ({ data:{}, settings:{ copy:false } })
bundled ({ data:{}, settings:{ copy:false } })

// @ts-expect-error unknown setting names are rejected
walk ({ data:{}, settings:{ copies:false } })
// @ts-expect-error unknown setting names are rejected through the bundle too
bundled ({ data:{}, settings:{ copies:false } })
`
        , 'cjs.cts' : `
import walk = require ( '@peter.naydenov/walk' )

const settings : walk.Settings = { copy:false, breadcrumbs:false }
walk ({ data:{}, settings })

// @ts-expect-error unknown setting names are rejected for CommonJS consumers
walk ({ data:{}, settings:{ copies:false } })
`
        , 'plain.js' : `
import walk from '@peter.naydenov/walk'

/** @type {import('@peter.naydenov/walk').Settings} */
const settings = { breadcrumbs:false, parentPath:false }
walk ({ data:{}, settings })

// @ts-expect-error unknown setting names are rejected in JavaScript
walk ({ data:{}, settings:{ copies:false } })
`
        , 'plain.cjs' : `
const walk = require ( '@peter.naydenov/walk' )

walk ({ data:{}, settings:{ copy:false } })

// @ts-expect-error unknown setting names are rejected for JavaScript require
walk ({ data:{}, settings:{ copies:false } })
`
    };

let project;



describe ( 'Walk: published declarations', () => {

    beforeAll ( () => {
                project = mkdtempSync ( join ( tmpdir(), 'walk-declarations-' ))
                mkdirSync ( join ( project, 'node_modules', '@peter.naydenov' ), { recursive:true })
                symlinkSync ( root, join ( project, 'node_modules', '@peter.naydenov', 'walk' ), 'dir' )
                for ( const [ name, content ] of Object.entries ( consumers ) )   writeFileSync ( join ( project, name ), content )
        })



    afterAll ( () => {
                if ( project )   rmSync ( project, { recursive:true, force:true })
        })



    it ( 'Type-check import, require, bundle and JSDoc consumers', () => {
                const check = spawnSync ( tsc, [ '-p', project ], { encoding:'utf8' })
                expect ( check.error ).toBeUndefined ()
                expect ( check.status, check.stdout + check.stderr ).toBe ( 0 )
        }) // it Type-check consumers



    it ( 'Expose every exported type to CommonJS consumers', () => {
                const esm = readFileSync ( join ( root, 'types', 'main.d.ts' ), 'utf8' )
                const cjs = readFileSync ( join ( root, 'dist', 'walk.d.cts' ), 'utf8' )
                const names = [ ...esm.matchAll ( /^export type (\w+)/gm ) ].map ( match => match[1] )
                expect ( names ).toContain ( 'Settings' )
                for ( const name of names )   expect ( cjs, `dist/walk.d.cts is missing type ${name}` ).toContain ( `type ${name} = import('../types/main.js').${name};` )
        }) // it Expose every exported type

}) // describe
