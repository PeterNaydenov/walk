function validateForInsertion ( k, result ) {
    if ( !Array.isArray ( result ) )   return false
    const index = Number ( k );
    // Array indexes are canonical decimal strings from 0 through 2^32 - 2.
    return Number.isInteger ( index ) && index >= 0 && index < 4294967295 && String ( index ) === k
} // validateForInsertion func.



export default validateForInsertion


