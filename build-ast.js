const fs = require('fs')
const hollow = require('./hollow')

const actions = {
  make_symbol: (input, start, end, elements) => {
    return {type: 'symbol', value: elements[0]}
  },
  make_keyword: (input, start, end, elements) => {
    return {type: 'keyword', value: elements[1]}
  },
  make_string: (input, start, end, elements) => {
    return {type: 'string', value: elements[1]}
  },
  make_float: (input, start, end, elements) => {
    return {type: 'float', value: parseFloat(elements.join(""))}
  },
  make_list: (input, start, end, elements) => {
    return {type: 'list', value: elements.slice(1, -1)}
  },
  make_object: (input, start, end, elements) => {
    const object = {}
    for (let i = 1; i < elements.length - 1; i += 2) {
      object[elements[i]] = elements[i + 1]
    }

    return {type: 'object', value: object}
  },
  make_funcall: (input, start, end, elements) => {
    return {type: 'funcall', value: elements.slice(1, -1)}
  },

}

fs.readFile('./sample/main.hollow', 'utf8', (err, data) => {
  console.log(hollow.parse(data, {actions}))
})
