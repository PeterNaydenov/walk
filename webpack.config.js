'use strict';

module.exports = {
      entry: './src/main.js'
    , mode: 'production'
    , output: {
              filename: "walk.min.js"
            , path: __dirname + "/dist"
            , library: 'walk'
            , libraryTarget: "var"
            , umdNamedDefine : true
       }
    , optimization: {}
    , module: {
          rules: [
                  {
                        test: /\.js$/
                      , exclude: /node_modules/
                      , use : { 
                            loader: 'babel-loader'
                          , options : { presets: ['@babel/preset-env']}
                        }
                    }
                ]
        }
}