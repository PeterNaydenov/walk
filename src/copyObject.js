"use strict"

import findType from "./findType.js";
import validateForInsertion from "./validateForInsertion.js";



function copyObject ( resource, result, extend, cb, breadcrumbs ) {
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
                        ;
                    if ( type !== 'simple' && objectCallback ) {
                                        item = objectCallback ({ value:item, key:k, breadcrumbs: `${breadcrumbs}/${k}`, IGNORE })
                                        if ( item === IGNORE )   return
                                        type = findType ( item )
                        }

                    if ( type === 'simple' ) {
                                    if ( !keyCallback ) {  
                                            result[k] = item
                                            return
                                        }
                                    let keyRes = keyCallback ({ value:item, key:k, breadcrumbs: `${breadcrumbs}/${k}`, IGNORE });
                                    if ( keyRes === IGNORE )   return
                                    const canInsert = validateForInsertion ( k, result );  // Find if it's array or object?
                                    if ( canInsert )  result.push ( keyRes ) // It's an array
                                    else              result [k] = keyRes    // It's an object
                        }
                    if ( type === 'object' ) {
                            const newObject = {};
                            if ( resultIsArray && keyNumber )   result.push ( newObject )
                            else                                result[k] = newObject
                            extend.push ( generateList ( item, newObject,  extend, cb, `${breadcrumbs}/${k}` )   )
                       }
                    if ( type === 'array' ) {
                            const newArray = [];
                            if ( resultIsArray && keyNumber )   result.push ( newArray )
                            else                                result[k] = newArray
                            extend.push ( generateList( item, newArray, extend, cb, `${breadcrumbs}/${k}` )   )
                        }
            })
} // copyObject func.



function* generateList ( data, location, ex, callback, breadcrumbs ) {
    yield copyObject ( data , location, ex, callback, breadcrumbs )  
} // generateList func.



export default copyObject


