const fs = require('fs')
const {resolve} = require('path')
const peg = require('pegjs')
const {
  identity, join, findLastIndex, values, prop, map, fromPairs,
} = require('ramda')

const parser = peg.generate(fs.readFileSync('./src/hollow.pegjs', 'utf8'))

const createNode = (type, value) => ({type, value})

const removeSpaces = nodes =>
  nodes.filter(identity).filter(({type}) => type !== 'space')

const parseOpts = opts =>
  fromPairs(opts.map(([key, value]) => [key.value, value]))

const compile = ({target, path}) => {
  const modules = {}

  const writers = {
    // Namespace definitions are stripped, out, but the meta data is
    // used in require
    ns: value => '',
    require: ({name, ...node}) => {
      const symbol = createNode('symbol', `module__${name.value.replace('.', '_')}`)

      // Only include the source code for the module once, and call it each time
      if (!modules[name.value]) {
        const [ns, ...ast] = parseModule(name.value)

        if (ns.type !== 'ns') {
          throw new Error(`Missing ns declaration for module ${name}`)
        }

        const opts = parseOpts(ns.value.opts)
        const accept = (opts.accept || [])
        const wrapper = writers.defn({name: symbol, args: accept, body: ast})

        modules[name.value] = {accept, wrapper}
      }

      const {wrapper, accept} = modules[name.value]
      const args = removeSpaces(node.args)

      if (accept.length !== args.length) {
        throw new Error(`Invalid number of arguments passed to ${name.value}`)
      }

      return writers.funcall({fn: symbol, args})
    },
    defn: ({name, args, body}) => {
      const lastNonSpace = findLastIndex(({type}) => type !== 'space', body)
      const rest = body.slice(0, lastNonSpace)
      const last = body[lastNonSpace]
      const bodyText = `${writeNodes(rest)} return ${writeNode(last)}`

      return `function ${name.value} (${joinArgs(args)}) {${bodyText}};`
    },
    def: ({name, body}) => `const ${name.value} = ${writeNode(body)};`,
    fn: ({args, body}) => `(${joinArgs(args)}) => { return ${writeNodes(body)} }`,
    funcall: ({fn, args}) => {
      const wrapped = fn.type === 'symbol' ? fn.value : `(${writeNode(fn)})`

      return `${wrapped}(${joinArgs(args)})`
    },
    string: value => `"${value}"`,
    keyword: value => `"${value}"`,
    object: (value) => {
      const pairs = value.map(removeSpaces).map(map(node => writeNode(node)))

      return `{${pairs.map(join(': ')).join(', ')}}`
    },
    array: identity,
    float: identity,
    space: identity,
    symbol: identity,
  }

  const joinArgs = args => removeSpaces(args).map(writeNode).join(', ')

  const writeNode = (node) => {
    const writer = writers[node.type]

    if (!writer) {
      throw new Error(`Unknown node type: ${node.type} (${JSON.stringify(node)})`)
    }

    return writer(node.value)
  }

  const writeNodes = (nodes) => {
    return nodes.map(node => writeNode(node)).join("")
  }

  const write = (ast) => {
    const output = writeNodes(ast)
    const stdlib = ['ramda']

    return stdlib
      .map(name => `Object.assign(global, require('${name}'))\n`)
      .concat(values(modules).map(prop('wrapper')))
      .concat(output)
      .join('\n')
  }

  const resolvePath = name => {
    return resolve(path, ...name.split('.')) + '.hollow'
  }

  const parseModule = name => {
    const source = fs.readFileSync(resolvePath(name), 'utf8')

    try {
      return parser.parse(source)
    } catch (e) {
      if (e.location) {
        const {line, column} = e.location.start
        const msg = e.message.slice(0, -1)

        throw new Error(`${msg} at line ${line}, column ${column} in ${name}`)
      } else {
        throw e
      }
    }
  }

  return write(parseModule(target))
}

module.exports = {compile}
