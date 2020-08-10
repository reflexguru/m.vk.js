//зависимости

var Chat = require('../handlers/longpoll/Chat')

/**
 * Значения чтений сообщений
 * @type {Class}
 */
class ChatsList {
  constructor(chats, token) {
    this._token = token
    let t = this
    this.chats = chats
    for(let i = 0; i < chats.length; i++) {
      this[this.chats[i].id] = function() {
        return new Chat(t.chats[i].id, t.token)
      }
    }
    delete this.chats
  }

  /**
   * Значения чтений сообщений
   * @param {Integer} [id] ID диалога
   */
  find(id) {
    let chats = Object.entries(this)
    for(let i = 0; i < chats.length; i++) {
      if(chats[i][0] == id)
        return new Chat(chats[i][0], this._token)
    }
  }

  /**
   * Конвертировать коллекцию в массив по типу [id, получить его()]
   */
  array() {
    let arr = []
    Object.entries(this).forEach(function(id) {
      if(id[0] != '_token')
        arr.unshift([id[0], id[1]])
    })
    return arr
  }
}

module.exports = ChatsList