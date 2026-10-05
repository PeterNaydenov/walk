import FINISH from "./finish.js";



function createCallbackArgs ( value, key, IGNORE, breadcrumbs, parentPath, settings ) {
    if ( settings.breadcrumbs && settings.parentPath )   return { value, key, breadcrumbs, parentPath, IGNORE, FINISH }
    if ( settings.breadcrumbs )                         return { value, key, breadcrumbs, IGNORE, FINISH }
    if ( settings.parentPath )                          return { value, key, parentPath, IGNORE, FINISH }
    return { value, key, IGNORE, FINISH }
} // createCallbackArgs func.



export default createCallbackArgs

