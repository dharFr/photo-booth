module.exports = {
 entry: './src/main.js',
 output: {
   filename: 'dist/bundle.js'
 },
 module: {

   loaders: [
     {
       test: /\.js$/,
       exclude: /node_modules/,
       loader: 'babel-loader'
     }
   ]
 },
 resolve: {
   extensions: ['', '.js', '.es6']
 },
 // debug: true,
 devtool: 'inline-source-map'
}