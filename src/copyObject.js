"use strict"

import findType from "./findType.js";
import validateForInsertion from "./validateForInsertion.js";
import setKey from "./setKey.js";



function copyObject ( resource, result, extend, cb, breadcrumbs, ...args ) {
    let
          [ keyCallback, objectCallback ] = cb
        , keys = Object.keys ( resource )
        ;

    keys.forEach ( k => {
                    let
                          type = findType(resource[k])
                        , item  = resource[k]
                        , resultIsArray = (findType (result) === 'array')
                        , keyNumber = !isNaN ( k )
                        , IGNORE = Symbol ( 'ignore___' )
                        , br = `${breadcrumbs}/${k}`
                        ;

                    if ( type !== 'simple' && objectCallback ) {
                                        item = objectCallback ({ value:item, key:k, breadcrumbs: br, IGNORE }, ...args )
                                        if ( item === IGNORE )   return
                                        type = findType ( item )
                        }

                    if ( type === 'simple' ) {
                                    if ( !keyCallback ) {
                                            const canInsert = validateForInsertion ( k, result );  // Find if it's array or object?
                                            if ( canInsert )    result.push ( item )     // It's an array
                                            else                setKey ( result, k, item ) // It's an object
                                            return
                                        }
                                    let keyRes = keyCallback ({ value:item, key:k, breadcrumbs: br, IGNORE }, ...args );
                                    if ( keyRes === IGNORE )   return
                                    const canInsert = validateForInsertion ( k, result );  // Find if it's array or object?
                                    if ( canInsert )    result.push ( keyRes )      // It's an array
                                    else                setKey ( result, k, keyRes ) // It's an object
                        }

                    if ( type === 'object' ) {
                            const newObject = {};
                            if ( resultIsArray && keyNumber )   result.push ( newObject )
                            else                                setKey ( result, k, newObject )
                            extend.push ( generateList ( item, newObject,  extend, cb, br, args ) )
                       }

                    if ( type === 'array' ) {
                            const newArray = [];
                            if ( resultIsArray && keyNumber )   result.push ( newArray )
                            else                                setKey ( result, k, newArray )
                            extend.push ( generateList( item, newArray, extend, cb, br, args ) )
                        }
            })
} // copyObject func.



function* generateList ( data, location, ex, callback, breadcrumbs, args ) {
    yield copyObject ( data , location, ex, callback, breadcrumbs, ...args )
} // generateList func.



export default copyObject


