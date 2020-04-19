const Compiler = require('./compiler.js')
const options = require('../simplepack.config.js')

new Compiler(options).run()
