const omitted = Symbol ( 'omitted' );



function isContainer ( value ) {
    return value !== null && typeof value === 'object'
        && !( value instanceof Date || value instanceof Map || value instanceof Uint8Array )
} // isContainer func.



function assign ( target, key, value ) {
    const index = Number ( key );
    if ( Array.isArray ( target ) && Number.isInteger ( index ) && index >= 0 && index < 4294967295 && String ( index ) === key )   target.push ( value )
    else   Object.defineProperty ( target, key, { value, enumerable:true, configurable:true, writable:true } )
} // assign func.



function generateData ( seed, circular = false ) {
    let state = seed;
    function random ( limit ) {
        state = ( Math.imul ( state, 1664525 ) + 1013904223 ) >>> 0
        return state % limit
    } // random func.

    const leaves = [ undefined, null, false, true, '', 'text', seed, -seed, NaN, -0, BigInt ( seed ), Symbol ( 'leaf' ), new Date ( seed ), new Map ([ ['number',seed] ]), new Uint8Array ([ seed % 256 ]), () => seed ];
    const names = [ 'number', 'with/slash', '', '__proto__', '01', '-1', '4294967295' ];

    function container ( depth, array ) {
        const value = array ? new Array ( 4 ) : {};
        for ( let index = 0; index < 4; index++ ) {
                if ( array && random ( 4 ) === 0 )   continue
                const key = array ? String ( index ) : names[random ( names.length )] + ( index === 0 ? '' : index );
                const child = depth && random ( 3 ) !== 0 ? container ( depth - 1, random ( 2 ) === 0 ) : leaves[random ( leaves.length )];
                // Input arrays keep holes and their original indexes.
                Object.defineProperty ( value, key, { value:child, enumerable:true, configurable:true, writable:true } )
            }
        if ( array ) {
                Object.defineProperty ( value, '01', { value:seed, enumerable:true, configurable:true, writable:true } )
                Object.defineProperty ( value, '__proto__', { value:{ number:seed }, enumerable:true, configurable:true, writable:true } )
            }
        return value
    } // container func.

    let data = container ( 4, seed % 2 === 0 );
    const shared = { number:seed, nested:[ seed + 1, { number:seed + 2 } ] };
    const additions = {
              _ignoredLeaf : seed
            , _expandedLeaf : seed
            , _ignoredBranch : { hidden:seed }
            , _passedBranch : { number:seed, nested:{ number:seed + 1 } }
            , _changedBranch : { original:seed }
            , _changedPassedBranch : { original:seed }
            , _primitiveBranch : { original:seed }
            , first : shared
            , second : shared
        };
    for ( const key of Object.keys ( additions ) )   Object.defineProperty ( data, key, { value:additions[key], enumerable:true, configurable:true, writable:true } )
    if ( circular ) {
            data.self = data
            shared.self = shared
            shared.parent = data
        }
    if ( seed % 4 === 0 ) {
            const inner = data;
            for ( let index = 0; index < 40 + seed; index++ )   data = { child:data }
            data = { left:data, right:data }
            if ( circular )   inner.outer = data
        }
    return data
} // generateData func.



function objectRule ( value, key, seed ) {
    if ( key === '_ignoredBranch' )   return { kind:'ignore' }
    if ( key === '_passedBranch' )   return { kind:'pass', value }
    if ( key === '_changedBranch' )   return { kind:'value', value:{ number:seed + 10, nested:[seed + 20] } }
    if ( key === '_changedPassedBranch' )   return { kind:'pass', value:{ number:seed + 40, nested:{ number:seed + 50 } } }
    if ( key === '_primitiveBranch' )   return { kind:'value', value:seed + 30 }
    return { kind:'value', value }
} // objectRule func.



function keyRule ( value, key, seed ) {
    if ( key === '_ignoredLeaf' )   return omitted
    if ( key === '_expandedLeaf' )   return { number:seed + 60, nested:[ seed + 70 ] }
    return typeof value === 'number' ? value + 1 : value
} // keyRule func.



function event ( kind, key, path, settings ) {
    return JSON.stringify ([ kind, key, settings.breadcrumbs ? [ ...path, key ].join ( '/' ) : null, settings.parentPath ? path : null, kind === 'key' ? false : null ])
} // event func.



function reference ( data, seed, settings ) {
    // Deliberately recursive: compare the public transformation contract
    // without using Walk's queue, helpers, type finder, or ancestor lookup.
    const ancestors = new Map(), events = [];

    function visit ( value, key, path, skipKey = false ) {
        let pass = false;
        if ( isContainer ( value ) ) {
                events.push ( event ( 'object', key, path, settings ) )
                const decision = objectRule ( value, key, seed );
                if ( decision.kind === 'ignore' )   return omitted
                value = decision.value
                pass = decision.kind === 'pass'
                // A parent PASS suppresses a primitive object replacement too.
                if ( !isContainer ( value ) && ( pass || skipKey ) )   return value
            }
        if ( !isContainer ( value ) ) {
                if ( skipKey )   return value
                events.push ( event ( 'key', key, path, settings ) )
                value = keyRule ( value, key, seed )
                if ( value === omitted || !isContainer ( value ) )   return value
            }
        if ( ancestors.has ( value ) )   return ancestors.get ( value )
        const result = Array.isArray ( value ) ? [] : {};
        ancestors.set ( value, result )
        for ( const childKey of Object.keys ( value ) ) {
                const child = value[childKey];
                // PASS is local: nested containers get their own callbacks.
                const copied = visit ( child, childKey, [ ...path, key ], pass )
                if ( copied !== omitted )   assign ( result, childKey, copied )
            }
        ancestors.delete ( value )
        return result
    } // visit func.

    return { result:visit ( data, 'root', [] ), events:events.sort() }
} // reference func.



function containers ( data ) {
    const found = new Set();
    function visit ( value ) {
        if ( !isContainer ( value ) || found.has ( value ) )   return
        found.add ( value )
        for ( const key of Object.keys ( value ) )   visit ( value[key] )
    } // visit func.
    visit ( data )
    return found
} // containers func.



function freezeData ( data ) {
    for ( const value of containers ( data ) )   Object.freeze ( value )
    return data
} // freezeData func.



export { omitted, isContainer, generateData, objectRule, keyRule, reference, containers, freezeData }
