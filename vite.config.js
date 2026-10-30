import { defineConfig } from 'vite';


// Vite builds with Rolldown. The module resolution is built in, so no
// extra plugin is needed. The package has no runtime dependencies and
// 'src/main.js' imports nothing.
//
// The build target is ES2015. The bundles run in every browser of the
// 'browserslist' section.
//
// 'emptyOutDir' is off. 'dist/walk.d.cts' and 'dist/walk.esm.d.mts' are
// maintained by hand and are not built.

export default defineConfig ({
      build: {
            lib: {
                  entry    : 'src/main.js'
                , name     : 'walk'
                , formats  : [ 'es', 'cjs', 'umd' ]
                , fileName : format => format === 'es'  ? 'walk.esm.mjs'
                                : format === 'cjs' ? 'walk.cjs'
                                : 'walk.umd.js'
            }
        , target        : 'es2015'
        , minify        : true
        , emptyOutDir   : false
      }
})
