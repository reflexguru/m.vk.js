//зависимости

var req = require('https')

class RestCallerAsync {
  constructor(token) {
    this.accesstoken = token
  }

  _(method, opts, apiver) {
    let t = this.accesstoken
    return new Promise(function(resolve, reject) {
      let newopts = ''

      Object.entries(opts).forEach(function(opt) {
        if(opt[0] != 'customToken')
          newopts += `&${opt[0]}=${opt[1]}`
      })

      let tkn = opts.customToken || t

      req.get(`https://api.vk.com/method/${method}?access_token=${tkn}${newopts}&v=${apiver}`, function(resp) {
        let res = ''
        resp.on('data', function(data) {
          res += data
        })

        resp.once('end', function() {

          if(res && JSON.parse(String(res)).error) {
            let err = JSON.parse(String(res)).error
            console.log(`VK api returned a error: \n   code: ${err.error_code}\n   error: ${err.error_msg}`)
          }
    
          resolve(JSON.parse(String(res)))
        })
      })
    })
  }
}

module.exports = RestCallerAsync