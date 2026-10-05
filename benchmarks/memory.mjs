import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import walk from '../src/main.js'



const shapes = [ 'flat', 'records', 'deep' ];
const variants = [
          { name:'copy', settings:{} }
        , { name:'scan', settings:{ copy:false } }
        , { name:'copy-no-paths', settings:{ breadcrumbs:false, parentPath:false } }
        , { name:'scan-no-paths', settings:{ copy:false, breadcrumbs:false, parentPath:false } }
    ];
const samples = 5;
const mib = 1024 * 1024;



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



function collect () {
    global.gc()
    global.gc()
    return process.memoryUsage()
} // collect func.



function measure ( shape, variant ) {
    if ( !global.gc )   throw new Error ( 'The worker needs --expose-gc' )
    const runtime = collect();
    let data = makeData ( shape );
    const baseline = collect();
    let largestHeap = baseline.heapUsed, callbacks = 0, leaves = 0, containers = 0;
    const interval = shape === 'deep' ? 64 : 1024;

    function observe () {
        callbacks++
        if ( callbacks % interval === 0 )   largestHeap = Math.max ( largestHeap, process.memoryUsage().heapUsed )
    } // observe func.

    const options = {
              data
            , settings : variant.settings
            , objectCallback : ({ value }) => { containers++; observe(); return value }
            , keyCallback : ({ value }) => { leaves++; observe(); return value }
        };
    let result = walk ( options );
    largestHeap = Math.max ( largestHeap, process.memoryUsage().heapUsed )
    const retained = collect();
    // Node reports the lifetime RSS high-water mark in KiB. It includes
    // runtime startup and input construction, not just the walk.
    const processPeakRss = process.resourceUsage().maxRSS * 1024;

    assert.equal ( leaves, shape === 'flat' ? 1000000 : shape === 'records' ? 600000 : 1 )
    assert.equal ( containers, shape === 'flat' ? 1 : shape === 'records' ? 300001 : 4001 )
    if ( variant.settings.copy === false )   assert.equal ( result, undefined )
    else {
            assert.notEqual ( result, data )
            if ( shape === 'flat' ) {
                    assert.equal ( result.key0, 0 )
                    assert.equal ( result.key999999, 999999 )
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
        }

    result = undefined
    const released = collect();
    const memory = {
              inputHeapMiB : ( baseline.heapUsed - runtime.heapUsed ) / mib
            , observedExtraHeapMiB : ( largestHeap - baseline.heapUsed ) / mib
            , retainedExtraHeapMiB : ( retained.heapUsed - baseline.heapUsed ) / mib
            , afterReleaseExtraHeapMiB : ( released.heapUsed - baseline.heapUsed ) / mib
            , processPeakRssMiB : processPeakRss / mib
        };
    // Keep the source reachable through every GC checkpoint above.
    assert.equal ( options.data, data )
    return { shape, variant:variant.name, leaves, containers, sampleEveryCallbacks:interval, ...memory }
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
            , cycleDetection : true
            , unit : 'MiB (1024 * 1024 bytes)'
        };
    const results = [];
    const filename = fileURLToPath ( new URL ( './memory.results.json', import.meta.url ) );
    const metrics = [ 'inputHeapMiB', 'observedExtraHeapMiB', 'retainedExtraHeapMiB', 'afterReleaseExtraHeapMiB', 'processPeakRssMiB' ];

    for ( const shape of shapes ) {
            const rows = variants.map ( variant => ({ shape, variant:variant.name, samples:[] }) );
            for ( let round = 0; round < samples; round++ ) {
                    // Rotate variants and run each sample in a fresh process.
                    // Measurements never overlap and previous heap growth cannot
                    // carry over from one variant to the next.
                    for ( let offset = 0; offset < variants.length; offset++ ) {
                            const index = ( round + offset ) % variants.length;
                            const child = spawnSync ( process.execPath, [ '--expose-gc', fileURLToPath ( import.meta.url ), '--worker', shape, variants[index].name ], { encoding:'utf8' } )
                            if ( child.error )   throw child.error
                            if ( child.status !== 0 )   throw new Error ( child.stderr || child.stdout || 'Memory worker failed' )
                            rows[index].samples.push ( JSON.parse ( child.stdout ) )
                            console.log ( `${shape} / ${variants[index].name} / sample ${round+1}` )
                        }
                }
            for ( const row of rows ) {
                    row.median = Object.fromEntries ( metrics.map ( metric => [ metric, +median ( row.samples.map ( sample => sample[metric] ) ).toFixed ( 3 ) ] ) )
                    row.range = Object.fromEntries ( metrics.map ( metric => {
                                              const values = row.samples.map ( sample => sample[metric] );
                                              return [ metric, [ Math.min ( ...values ), Math.max ( ...values ) ].map ( value => +value.toFixed ( 3 ) ) ]
                                          }) )
                    results.push ( row )
                    console.log ( JSON.stringify ({ shape, variant:row.variant, ...row.median }) )
                }
            writeFileSync ( filename, JSON.stringify ({ environment, results }, null, 2 ) + '\n' )
        }
    console.log ( 'Complete: 60 verified walks. Saved ' + filename )
} // run func.



if ( process.argv[2] === '--worker' ) {
        const shape = process.argv[3], variant = variants.find ( item => item.name === process.argv[4] );
        if ( !shapes.includes ( shape ) || !variant )   throw new Error ( 'Unknown shape or variant' )
        console.log ( JSON.stringify ( measure ( shape, variant ) ) )
    }
else    run()
