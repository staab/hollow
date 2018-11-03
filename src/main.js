const args = require('args')
const {compile} = require('./compiler.js')

args
  .option('target', 'The module name of the target entrypoint')
  .option('path', 'The module loader search path', process.cwd())

const flags = args.parse(process.argv)

if (!flags.target) {
  throw new Error('Target is required')
}

process.stdout.write(compile(flags))
