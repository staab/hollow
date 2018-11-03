function multi(dispatch) {
  const methods = {}
  const Default = 'utils/multi/Default'

  function call(...args) {
    const key = dispatch(...args)
    const method = methods[key] || methods[Default]

    if (!method) {
      throw new Error(`No match for multi "${name}" with dispatch value "${key}"`)
    }

    return method(...args)
  }

  call.add_method = (value, fn) => {
    methods[value] = fn
  }

  call.add_default = fn => {
    methods[Default] = fn
  }

  return call
}

module.exports = {multi}
