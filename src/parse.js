const fs = require('fs')
const peg = require('pegjs')
const {identity, join, findLastIndex, values, prop, map, fromPairs} = require('ramda')

const createNode = (type, value) => ({type, value})

const removeSpaces = nodes =>
  nodes.filter(identity).filter(({type}) => type !== 'space')

const parseOpts = opts =>
  fromPairs(opts.map(([key, value]) => [key.value, value]))

const joinArgs = args => removeSpaces(args).map(writeNode).join(', ')

const writers = {
  // Namespace definitions are stripped, out, but the meta data is
  // used in require
  ns: value => '',
  require: ({name, ...node}, ctx) => {
    const symbol = createNode('symbol', `module__${name.value.replace('.', '_')}`)

    // Only include the source code for the module once, and call it each time
    if (!ctx.modules[name.value]) {
      const [ns, ...ast] = doRequire(name.value)

      if (ns.type !== 'ns') {
        throw new Error(`Missing ns declaration for module ${name}`)
      }

      const opts = parseOpts(ns.value.opts)
      const accept = (opts.accept || [])
      const wrapper = writers.defn({name: symbol, args: accept, body: ast}, ctx)

      ctx.modules[name.value] = {accept, wrapper}
    }

    const {wrapper, accept} = ctx.modules[name.value]
    const args = removeSpaces(node.args)

    if (accept.length !== args.length) {
      throw new Error(`Invalid number of arguments passed to ${name.value}`)
    }

    return writers.funcall({fn: symbol, args}, ctx)
  },
  defn: ({name, args, body}, ctx) => {
    const lastNonSpace = findLastIndex(({type}) => type !== 'space', body)
    const rest = body.slice(0, lastNonSpace)
    const last = body[lastNonSpace]
    const bodyText = `${writeNodes(rest, ctx)} return ${writeNode(last, ctx)}`

    return `function ${name.value} (${joinArgs(args)}) {${bodyText}};`
  },
  def: ({name, body}, ctx) => `const ${name.value} = ${writeNode(body, ctx)};`,
  fn: ({args, body}, ctx) => `(${joinArgs(args)}) => { return ${writeNodes(body, ctx)} }`,
  funcall: ({fn, args}, ctx) => {
    const wrapped = fn.type === 'symbol' ? fn.value : `(${writeNode(fn, ctx)})`

    return `${wrapped}(${joinArgs(args)})`
  },
  string: value => `"${value}"`,
  keyword: value => `"${value}"`,
  object: (value, ctx) => {
    const pairs = value.map(removeSpaces).map(map(node => writeNode(node, ctx)))

    return `{${pairs.map(join(': ')).join(', ')}}`
  },
  array: identity,
  float: identity,
  space: identity,
  symbol: identity,
}

const writeNode = (node, ctx) => {
  const writer = writers[node.type]

  if (!writer) {
    throw new Error(`Unknown node type: ${node.type} (${JSON.stringify(node)})`)
  }

  return writer(node.value, ctx)
}

const writeNodes = (nodes, ctx) => {
  return nodes.map(node => writeNode(node, ctx)).join("")
}

const write = (ast, ctx = {modules: {}}) => {
  const output = writeNodes(ast, ctx)
  const stdlib = ['ramda']

  return stdlib
    .map(name => `Object.assign(global, require('${name}'))`)
    .concat(values(ctx.modules).map(prop('wrapper')))
    .concat(output)
    .join('\n')
}

const resolve = name => {
  return `./${name.replace('.', '/')}.hollow`
}

const doRequire = name => {
  const source = fs.readFileSync(resolve(name), 'utf8')

  try {
    return parser.parse(source)
  } catch (e) {
    if (e.location) {
      const {line, column} = e.location.start

      throw new Error(
        `${e.message.slice(0, -1)} at line ${line}, column ${column} in ${name}`
      )
    } else {
      throw e
    }
  }
}

const grammar = fs.readFileSync('./hollow.pegjs', 'utf8')
const parser = peg.generate(grammar)
const ast = doRequire('sample.main')

console.log(write(ast))
