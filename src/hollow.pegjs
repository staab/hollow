{
  function node(type, value) {
    return {type: type, value: value}
  }
}

start =
  (expr / space)*

expr =
  ns / require / defn / def / fn / if / for / funcall
  / object / array / symbol / string / keyword / float / integer / space

ns =
  "(ns" space name: symbol
    space? opts: ("(" keyword space "[" (symbol / space)* "]" ")")* ")"
  {
    return node('ns', {name: name, opts: opts.map(opt => [opt[1], opt[4]])})
  }

require =
  "(require"
    space name: string
    args: (space / expr)* ")"
  {
    return node('require', {name: name, args: args})
  }

defn =
  "(defn"
    space name: symbol space
    "[" args: (space / symbol)* "]"
    body: (space / expr)* ")"
  {
    return node('defn', {name: name, args: args, body: body})
  }

def =
  "(def" space name: symbol space body: expr ")" {
    return node('def', {name: name, body: body})
  }

fn =
  "(fn"
    space "[" args: (space / symbol)* "]"
    space body: (space / expr)* ")"
  {
    return node('fn', {args: args, body: body})
  }

if =
  "(if" space cond: expr space succeed: expr space fail: expr? ")"
  {
    return node('_if', {cond: cond, succeed: succeed, fail: fail})
  }

for =
  "(for"
    space "[" name: symbol space expr: expr "]"
    space body: (space / expr)* ")"
  {
    return node('_for', {name: name, expr: expr, body: body})
  }

funcall =
  "(" fn: expr args: (expr / space)* ")" {
    return node('funcall', {fn: fn, args: args})
  }

keyword =
  ':' v: symbol {
    return node('keyword', v.value)
  }

array =
  "[" v: (expr / space)* "]" {
    return node('array', v)
  }

object =
  "{" pairs: (space? keyword space expr)* "}" {
    return node('object', pairs)
  }

symbol =
  v: [a-zA-Z_?!\.]+ ("." [a-zA-Z_?!]+)* {
    return node('symbol', v.join(""))
  }

string =
  '"' v: [^"]* '"' {
    return node('string', v.join(""))
  }

float =
  v: [0-9]+ "." [0-9]+ {
    return node('float', parseFloat(v.join("")))
  }

integer =
  v: [0-9]+ {
    return node('integer', parseInt(v.join(""), 10))
  }

space =
  v: [ \n]+ {
    return node('space', v.join(""))
  }
