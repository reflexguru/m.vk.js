//зависимости

var restclient = require('./ApiRequestAsync')
var event = require('events')
var req = require('https')

class LongPollServer extends event {
  constructor(token, gid, apiver, clientID) {
    super()

    this.token = token
    this.apiver = apiver

    this.rest = new restclient(this.token)

    let th = this

    function update(ts, server, key) {
      req.get(`${server}?act=a_check&key=${key}&ts=${ts}&wait=25`, function(res) {
        let d = ''
        res.on('data', function(data) {
          d += data
        })
        res.once('end', function() {
          try {
            let got = JSON.parse(d)
            if(!got.failed) {
              update(got.ts, server, key)
            } else {
              connect(th)
              th.emit('reconnecting')
            }
            if(got.updates && got.updates.length > 0) {
              console.log(got.updates)
              got.updates.forEach(function(upd) {
                if(upd.type == 'message_new') {
                  th.emit('message', upd)
                }
              })
            }
          } catch(e) {
            console.log(e)
          }
        })
      })
    }

    async function connect(t) {
      t.lpinfo = (await t.rest._('groups.getLongPollServer', {group_id: gid}, apiver)).response
      update(t.lpinfo.ts, t.lpinfo.server, t.lpinfo.key)
    }

    connect(this)
  }
}

module.exports = LongPollServer