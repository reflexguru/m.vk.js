//зависимости

var asyncrestclient = require('../../workers/ApiRequestAsync')
var Chat = require('./Chat')
var User = require('./User')


/**
 * Сообщение из переписки
 * @type {Class}
 */
class Message {
  constructor(obj, token) {
    this._token = token
    this._arest = new asyncrestclient(token)

    let msg = obj

    /**
     * Текст сообщения
     * @type {String}
     */
    this.content = msg.text

    /**
     * Дата отправки сообщения
     * @type {Date}
     */
    this.date = new Date(msg.date)

    /**
     * ID сообщения
     * @type {Integer}
     */
    this.id = msg.id

    /**
     * ID автора сообщения
     * @type {Integer}
     */
    this.authorId = msg.from_id

    /**
     * Теги прикрепленных объектов в сообщении
     * @type {String}
     */
    this.attachments = msg.attachments

    /**
     * ID чата, в который было отправлено сообщение
     * @type {String}
     */
    this.chatId = msg.peer_id
    if(msg.payload && JSON.parse(msg.payload))
      /**
       * Команда в сообщении (если была нажата кнопка, содержащая команду, например)
       * @type {String}
       */
      this.payload = JSON.parse(msg.payload)

    if(msg.reply_message) {
      /**
       * Сообщение, на которое отвечает данное сообщение
       * @type {Message}
       */
      this.replied = new Message(msg.reply_message, this._token)
    }

    if(msg.fwd_messages) {
      /**
       * Пересланные сообщения
       * @type {Array<Message>}
       */
      this.forwarded = []
      for(let i = 0; i < msg.fwd_messages.length; i++) {
        this.forwarded.push(new Message(msg.fwd_messages[i], this._token))
      }
    }

    /**
     * Действие сообщения
     * @type {Object}
     */
    if(msg.action) {
      this.action = msg.action
    }
  }

  /**
   * Диалог, в котором это сообщение находится
   * @type {Chat}
   */
  get chat() {
    return new Chat(this.chatId, this._token)
  }

  /**
   * Получаем автора сообщения
   * @type {User}
   */
  get author() {
    return new User(this.authorId, this._token, this.chatId)
  }

  /**
   * Изменяет текущее сообщение на новое
   * @param {String} Текст сообщения
   * @param {MessageOptions} Опции сообщения (фотографии и т.д.)
   * @example
   * msg.edit('Привет!', {
   *   map: {
   *     lat: 55.75222,
   *     long: 37.616556
   *   },
   *   attach: ['video-47795388_456239290']
   * })
   */
  async edit(msg, opts) {
    let t = this
    let opt = opts
    let m = msg
    return new Promise(function(resolve, reject) {
      let txt
      if(typeof m != 'object') {
        txt = m
      } else {
        opt = m
        txt = ''
      }
      let sent = false
      let values = {
        peer_id: t.chatId,
        message: encodeURIComponent(txt),
        message_id: t.id
      }
      if(opt) {
        if(opt.attach) {
          try {
            values.attachment = opt.attach.join(',')
          } catch {
            return reject('VKJS: invalid attachments')
          }
        }
        if(opt.sticker) {
          values.sticker_id = opt.sticker
        }
        if(opt.map) {
          if(opt.map.lat && opt.map.long) {
            values.lat = opt.map.lat
            values.long = opt.map.long
          } else {
            return reject('VKJS: missing map values')
          }
        }
        if(opt.keyboard) {
          values.keyboard = encodeURIComponent(JSON.stringify(opt.keyboard))
        }
      }
      t._arest._('messages.edit', values, '5.95')
    })
  }

  /**
   * Отправляет сообщение в диалог сообщения
   * @param {String} Текст сообщения
   * @param {MessageOptions} Опции сообщения (фотографии и т.д.)
   * @returns {Promise<Message>}
   * @example
   * chat.send('Привет!', {
   *   map: {
   *     lat: 55.75222,
   *     long: 37.616556
   *   },
   *   attach: ['video-47795388_456239290']
   * })
   */
  async reply(msg, opts) {
    let t = this
    let opt = opts
    let m = msg
    return new Promise(async function(resolve, reject) {
      let txt
      if(typeof m != 'object') {
        txt = m
      } else {
        opt = m
        txt = ''
      }
      let sent = false
      let values = {
        peer_id: t.chatId,
        message: encodeURIComponent(txt),
        random_id: Math.random() * 100000
      }
      if(opt) {
        if(opt.attach) {
          try {
            values.attachment = opt.attach.join(',')
          } catch {
            return reject('VKJS: invalid attachments')
          }
        }
        if(opt.sticker) {
          values.sticker_id = opt.sticker
        }
        if(opt.map) {
          if(opt.map.lat && opt.map.long) {
            values.lat = opt.map.lat
            values.long = opt.map.long
          } else {
            return reject('VKJS: missing map values')
          }
        }
        if (opt.expires) {
          values.expire_ttl = opt.expires
        }
        if(opt.keyboard) {
          values.keyboard = encodeURIComponent(JSON.stringify(opt.keyboard))
        }
      }
      t._arest._('messages.send', values, '5.103').then(async function(resp) {
        let m = await new LoadingMessage(resp.response, t._token)
        resolve(m)
      })
    })
  }

  /**
   * Закрепляет сообщение
   */
  async pin() {
    console.log(this.id)
    this._arest._('messages.pin', {peer_id: this.authorId, message_id: this.id}, '5.95')
  }

  /**
   * Удаляет сообщение
   */
  async delete() {
    this._arest._('messages.delete', {delete_for_all: 1, message_ids: this.id}, '5.95')
  }
}

class LoadingMessage {
  constructor(obj, token) {
    return new Promise(async function(resolve, reject) {
      if(typeof obj == 'object') {
        resolve(new Message(obj, token))
      } else {
        let r = await new asyncrestclient(token)._('messages.getById', {message_ids: obj}, '5.95')
        let rr = r.response.items[0]
        resolve(new Message(rr, token))
      }
    })
  }
}

module.exports = LoadingMessage