const path = require('path')
const fs = require('fs')
const { getAST, getDependencies, transform } = require('./parser.js')

module.exports = class Compiler {
  constructor(options) {
    const { entry, output } = options

    this.entry = entry
    this.output = output
    this.modules = []
  }

  run() {
    const entryModule = this.buildModule(this.entry, true)

    this.modules.push(entryModule)

    this.modules.forEach(m => {
      m.dependencies.forEach(dep => {
        this.modules.push(this.buildModule(dep))
      })
    })

    this.emitFiles()
  }

  buildModule(filename, isEntry) {
    let ast

    if (isEntry) {
      ast = getAST(filename)
    } else {
      const absolutepath = path.join(process.cwd(), './src/', filename)

      ast = getAST(absolutepath)
    }

    return {
      filename,
      dependencies: getDependencies(ast),
      source: transform(ast),
    }
  }

  emitFiles() {
    const outputPath = path.join(this.output.path, this.output.filename)

    let modules = ''

    this.modules.forEach(m => {
      modules += `'${m.filename}': function(require, module, exports) {${m.source}},`
    })

    const bundle = `(function(modules) {
      function require(filename) {
        var fn = modules[filename]
        var module = {exports: {}}

        fn(require, module, module.exports)

        return module.exports
      }

      require('${this.entry}')
    })({ ${modules} })`

    fs.writeFileSync(outputPath, bundle, 'utf-8')
    console.log(bundle)
  }
}
