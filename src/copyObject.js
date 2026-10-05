"use strict"

import findType from "./findType.js";
import validateForInsertion from "./validateForInsertion.js";
import setKey from "./setKey.js";
import createCallbackArgs from "./createCallbackArgs.js";
import PASS, { isPass } from "./pass.js";
import IGNORE, { isIgnore } from "./ignore.js";
import { isFinish } from "./finish.js";



function copyObject ( resource, result, extend, cb, breadcrumbs, settings, control, parentPath, pass, parent, ancestors, ...args ) {
    let
          [ keyCallback, objectCallback ] = cb
        , keys = Object.keys ( resource )
        , parents = settings.detectCycles ? { data:resource, location:result, parent, depth:parent ? parent.depth + 1 : 0 } : undefined
        , last = false
        ;

    if ( ancestors )   ancestors.set ( resource, parents )

    for ( let index = 0; index < keys.length && !last; index++ ) {
                    const k = keys[index];
                    let
                          item = resource[k]
                        , type = findType ( item )
                        , canInsert = settings.copy && validateForInsertion ( k, result )
                        , br = settings.breadcrumbs && ( type !== 'simple' || ( !pass && keyCallback ) ) ? `${breadcrumbs}/${k}` : undefined
                        , passChild = false
                        ;

                    if ( type !== 'simple' && objectCallback && !control.isFinished ) {
                                        const callbackArgs = createCallbackArgs ( item, k, IGNORE, br, parentPath, settings )
                                        callbackArgs.PASS = PASS
                                        const replacement = objectCallback ( callbackArgs, ...args )
                                        if ( isFinish ( replacement ) ) {
                                                if ( !replacement.hasValue || !keyCallback ) {
                                                        finish ( replacement, result, k, canInsert, settings, control )
                                                        return parents
                                                    }
                                                // Discard unrelated pending work. Only the selected
                                                // final branch may schedule further containers.
                                                extend.length = 0
                                                control.restart = true
                                                control.isFinished = true
                                                last = true
                                                item = replacement.value
                                            }
                                        else if ( isIgnore ( replacement ) )   continue
                                        else if ( isPass ( replacement ) ) {
                                                passChild = true
                                                if ( replacement.hasValue )   item = replacement.value
                                            }
                                        else    item = replacement
                                        type = findType ( item )
                        }

                    if ( type === 'simple' ) {
                                    if ( passChild || ( pass && !control.isFinished ) || !keyCallback ) {
                                            if ( !settings.copy )   continue
                                            if ( canInsert )    result.push ( item )     // It's an array
                                            else                setKey ( result, k, item ) // It's an object
                                            continue
                                        }
                                    const callbackArgs = createCallbackArgs ( item, k, IGNORE, br, parentPath, settings );
                                    callbackArgs.isFinished = control.isFinished
                                    let keyRes = keyCallback ( callbackArgs, ...args );
                                    if ( isFinish ( keyRes ) ) {
                                            finish ( keyRes, result, k, canInsert, settings, control )
                                            return parents
                                        }
                                    if ( isIgnore ( keyRes ) )   continue
                                    // Re-type the returned value. A plain object/array returned from
                                    // keyCallback is walked into via the same work queue used for
                                    // original nested values; built-in types (Date, Map, Set, etc.) are
                                    // still 'simple' and stored by reference.
                                    const newType = findType ( keyRes )
                                    if ( newType === 'simple' ) {
                                            if ( !settings.copy )   continue
                                            if ( canInsert )    result.push ( keyRes )      // It's an array
                                            else                setKey ( result, k, keyRes ) // It's an object
                                            continue
                                        }
                                    item = keyRes
                                    type = newType
                        }

                    const circular = settings.detectCycles ? findParent ( item, parents, ancestors ) : undefined
                    if ( circular ) {
                            if ( !settings.copy )   continue
                            if ( canInsert )   result.push ( circular.location )
                            else               setKey ( result, k, circular.location )
                            continue
                        }

                    if ( type === 'object' ) {
                            const newObject = settings.copy ? {} : undefined;
                            if ( settings.copy ) {
                                    if ( canInsert )   result.push ( newObject )
                                    else               setKey ( result, k, newObject )
                                }
                            extend.push ( createJob ( item, newObject, br, parentPath, k, passChild, parents ) )
                       }

                    if ( type === 'array' ) {
                            const newArray = settings.copy ? [] : undefined;
                            if ( settings.copy ) {
                                    if ( canInsert )   result.push ( newArray )
                                    else               setKey ( result, k, newArray )
                                }
                            extend.push ( createJob ( item, newArray, br, parentPath, k, passChild, parents ) )
                        }
            }
    return parents
} // copyObject func.



function finish ( instruction, result, k, canInsert, settings, control ) {
    control.finished = true
    if ( !settings.copy || !instruction.hasValue )   return
    if ( canInsert )   result.push ( instruction.value )
    else               setKey ( result, k, instruction.value )
} // finish func.



function createJob ( data, location, breadcrumbs, parentPath, key, pass, parent ) {
    return { data, location, breadcrumbs, parentPath, key, pass, parent }
} // createJob func.



function findParent ( data, parent, ancestors ) {
    if ( ancestors )   return ancestors.get ( data )
    for ( let current = parent; current; current = current.parent ) {
            if ( current.data === data )   return current
        }
} // findParent func.



export default copyObject
