//зависимости

var Chat = require('../handlers/longpoll/Chat')

class ChatID {
  constructor(id, token) {
    this.id = id
    this._token = token
  }

  get() {
    return new Chat(this.id, this._token)
  }
}

module.exports = ChatID