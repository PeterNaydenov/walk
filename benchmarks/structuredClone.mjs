import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import walk from '../src/main.js'



/**
 *  Compares plain deep copies made by structuredClone with copies made by walk.
 *  Every operation receives the same three acyclic inputs used by the other
 *  benchmarks. Walk copies plain objects and arrays only; structuredClone also
 *  clones built-in objects and preserves shared references. The inputs here
 *  contain neither, so both operations produce equivalent plain copies.
 */
const shapes = [ 'flat', 'records', 'deep' ];
const operations = [
          { name:'structuredClone', run:data => structuredClone ( data ) }
        , { name:'walk', run:data => walk ({ data }) }
        , { name:'walk-keyCallback', run:data => walk ({ data, keyCallback:({ value }) => value }) }
        , { name:'walk-keyCallback-no-paths', run:data => walk ({ data, settings:{ breadcrumbs:false, parentPath:false }, keyCallback:({ value }) => value }) }
    ];
const samples = 5;
const warmups = 3;
const repeats = { flat:1, records:1, deep:5 };



function makeData ( shape ) {
    if ( shape === 'flat' ) {
            const data = {};
            for ( let index = 0; index < 1000000; index++ )   data['key'+index] = index
            return data
        }
    if ( shape === 'records' )   return Array.from ( { length:100000 }, ( _, id ) => ({ id, name:'item', metadata:{ active:true, score:id, tags:['a','b'] } }) )
    let data = { leaf:1 };
    for ( let index = 0; index < 4000; index++ )   data = { child:data }
    return data
} // makeData func.



function verify ( shape, data, result ) {
    assert.notEqual ( result, data )
    if ( shape === 'flat' ) {
            assert.equal ( result.key0, 0 )
            assert.equal ( result.key999999, 999999 )
            assert.equal ( Object.keys ( result ).length, 1000000 )
        }
    if ( shape === 'records' ) {
            assert.equal ( result.length, 100000 )
            assert.notEqual ( result[99999].metadata.tags, data[99999].metadata.tags )
            assert.deepEqual ( result[99999], data[99999] )
        }
    if ( shape === 'deep' ) {
            let original = data, copy = result;
            for ( let index = 0; index < 4000; index++ ) {
                    assert.notEqual ( copy, original )
                    original = original.child
                    copy = copy.child
                }
            assert.equal ( copy.leaf, 1 )
        }
} // verify func.



function measure ( shape, operation ) {
    const data = makeData ( shape );
    const count = repeats[shape];
    try {
            for ( let index = 0; index < warmups; index++ )   verify ( shape, data, operation.run ( data ) )
            if ( global.gc )   global.gc()
            const started = performance.now();
            let result;
            for ( let index = 0; index < count; index++ )   result = operation.run ( data )
            const elapsed = ( performance.now() - started ) / count;
            verify ( shape, data, result )
            return { shape, operation:operation.name, repeats:count, ms:elapsed }
        }
    catch ( error ) {
            // A failing operation is a result too. Record it instead of stopping the run.
            if ( error instanceof assert.AssertionError )   throw error
            return { shape, operation:operation.name, repeats:count, failed:true, error:`${error.name}: ${error.message}` }
        }
} // measure func.



function median ( values ) {
    return [ ...values ].sort (( a, b ) => a - b)[Math.floor ( values.length / 2 )]
} // median func.



function run () {
    const source = createHash ( 'sha256' );
    for ( const name of readdirSync ( new URL ( '../src/', import.meta.url ) ).sort() ) {
            if ( name.endsWith ( '.js' ) )   source.update ( name ).update ( readFileSync ( new URL ( '../src/' + name, import.meta.url ) ) )
        }
    const environment = {
              node : process.version
            , platform : process.platform
            , arch : process.arch
            , cpu : os.cpus()[0].model
            , memoryGiB : os.totalmem() / 1024 ** 3
            , measuredAt : new Date().toISOString()
            , sourceSha256 : source.digest ( 'hex' )
            , samples
            , warmupsPerSample : warmups
            , repeatsPerSample : repeats
            , unit : 'milliseconds for one complete copy'
        };
    const results = [];
    const filename = fileURLToPath ( new URL ( './structuredClone.results.json', import.meta.url ) );

    for ( const shape of shapes ) {
            const rows = operations.map ( operation => ({ shape, operation:operation.name, samples:[] }) );
            for ( let round = 0; round < samples; round++ ) {
                    // Rotate operations and run each sample in a fresh process,
                    // so JIT state and heap growth never carry between operations.
                    for ( let offset = 0; offset < operations.length; offset++ ) {
                            const index = ( round + offset ) % operations.length;
                            const child = spawnSync ( process.execPath, [ '--expose-gc', fileURLToPath ( import.meta.url ), '--worker', shape, operations[index].name ], { encoding:'utf8' } )
                            if ( child.error )   throw child.error
                            if ( child.status !== 0 )   throw new Error ( child.stderr || child.stdout || 'Benchmark worker failed' )
                            rows[index].samples.push ( JSON.parse ( child.stdout ) )
                            console.log ( `${shape} / ${operations[index].name} / sample ${round+1}` )
                        }
                }
            const baseline = rows[0];
            for ( const row of rows ) {
                    const failures = row.samples.filter ( sample => sample.failed );
                    if ( failures.length ) {
                            row.failed = true
                            row.error = failures[0].error
                            row.medianMs = null
                            row.rangeMs = null
                        }
                    else {
                            const values = row.samples.map ( sample => sample.ms );
                            row.medianMs = +median ( values ).toFixed ( 2 )
                            row.rangeMs = [ Math.min ( ...values ), Math.max ( ...values ) ].map ( value => +value.toFixed ( 2 ) )
                        }
                    results.push ( row )
                }
            for ( const row of rows )   row.relativeToStructuredClone = ( row.failed || baseline.failed ) ? null : +( row.medianMs / baseline.medianMs ).toFixed ( 2 )
            for ( const row of rows )   console.log ( JSON.stringify ({ shape, operation:row.operation, medianMs:row.medianMs, rangeMs:row.rangeMs, relativeToStructuredClone:row.relativeToStructuredClone, ...( row.failed ? { error:row.error } : {} ) }) )
            writeFileSync ( filename, JSON.stringify ({ environment, results }, null, 2 ) + '\n' )
        }
    console.log ( `Complete: ${shapes.length * operations.length * samples} verified copies. Saved ` + filename )
} // run func.



if ( process.argv[2] === '--worker' ) {
        const shape = process.argv[3], operation = operations.find ( item => item.name === process.argv[4] );
        if ( !shapes.includes ( shape ) || !operation )   throw new Error ( 'Unknown shape or operation' )
        console.log ( JSON.stringify ( measure ( shape, operation ) ) )
    }
else    run()
