//зависимости

var restclientasync = require('./workers/ApiRequestAsync')
var https = require('https')
// var FormData = require('form-data')
let longpoll = require('./workers/LongPoll')
var eventsemit = require('events')
var fs = require('fs')

//объекты вк

var Message = require('./handlers/longpoll/Message')
var Group = require('./handlers/longpoll/Group')
var Chat = require('./handlers/longpoll/Chat')
var User = require('./handlers/longpoll/User')
var RichKeyboard = require('./constructors/BotKeyboard')
var ChatID = require('./constructors/ChatID')
var ChatsList = require('./constructors/ChatsList')

var setApiVer = '5.103'

//главный класс

/**
 * Главный класс, управляющий всеми остальными
 * @type {Class}
 * @extends {EventEmitter}
 */
class VK extends eventsemit {
  constructor(token, gid, opts) {
    super()
    /**
     * Конструктор "клавиатур"
     * @type {RichKeyboard}
     */
    this.RichKeyboard = RichKeyboard

    this._debug = function(note, id = this.clientId) {
     /* if(id) {
        console.log('VK.JS debug from ' + id + ': ' + note)
      } else {
        console.log('VK.JS debug: ' + note)
      }*/
    }
    if(opts) {
      if(opts.debug && opts.id) {
        this.clientId = opts.id
        this._debug('id was changed')
      }
      if(opts.debug) {
        this._debug('debug option is enabled')
      }
    }

    this._debug('initialising client')

    this._exception = function(note, id = this.clientId) {
      if(id) {
        throw new Error('VK.JS exception from ' + id + ': ' + note)
      } else {
        throw new Error('VK.JS exception: ' + note)
      }
    }

    if(!token) {
      this._exception('missing access token')
    } else {
      this.token = token
      this._debug('changed token to ' + this.token)
    }

    if(gid) {
      this.myId = gid
    } else {
      this._exception('group id is invalid')
    }

    /**
     * Все, что связано с API Вконтакте
     * @type {Object}
     * @readonly
     */
    this.rest = {}

    /**
     * Позволяет совершать вызовы любых методов из API Вконтакте
     * @type {RestCaller}
     * @readonly
     */
    this.rest.async = new restclientasync(this.token)

    /*if(await this.rest.async._('groups.getTokenPermissions', {}, setApiVer).response.error) {
      this._exception('invalid access token')
    } else {
      this._debug('token is valid')
    }*/

    //создание longpoll сервера

    /**
     * LongPoll "приемник"
     * @type {LongPollServer}
     * @readonly
     */
    this.rest.longpoll = new longpoll(this.token, this.myId, setApiVer, this.clientID)

    let lp = this.rest.longpoll
    let global = this

    lp.on('message', async function(upd) {
      let message = await new Message(upd.object, this.token)
      global.emit('message', message)
      if(message.payload)
        global.emit('payload', message)
    })

    lp.on('reconnecting', function() {
      global.emit('LPReconnect', '')
    })
  }

  /**
   * Позволяет получить список всех диалогов сообщества с людьми
   * @returns {Promise<ChatsList>}
   */
  async chatsList() {
    let chts = await this.rest.async._('messages.getConversations', {count: 200}, '5.95')
    let mtoken = this.token
    let r = []
    chts.response.items.forEach(function(chat) {
      r.unshift({id: chat.conversation.peer.id})
    })
    return new ChatsList(r, mtoken)
  }

  /**
   * Позволяет совершать вызовы любых методов из api вконтакте
   * @type {RestCaller}
   * @param {String} [method=''] Метод, который захотите вызвать (см. документацию API Вконтакте)
   * @param {Object} [values={}] Любые значения, необходимые в определенном методе
   * @param {string} [version=''] Версия API, к которой вы собираетесь обратиться
   * @returns {Promise<Object>}
   * @example
   * var response = await client.callApi('groups.isMember', {group_id: 88383317, user_id: 271747106}, '5.95')
   */
  callApi(a, b, c) {
    return this.rest.async._(a, b, c)
  }

  /**
   * Позволяет совершать вызовы любых методов из api вконтакте (использовать не рекомендуется!)
   * @type {RestCaller}
   * @param {String} [method=''] Метод, который захотите вызвать (см. документацию API Вконтакте)
   * @param {Object} [values={}] Любые значения, необходимые в определенном методе
   * @param {string} [version=''] Версия API, к которой вы собираетесь обратиться
   * @returns {Object}
   * @example
   * var response = client.callApiSync('groups.isMember', {group_id: 88383317, user_id: 271747106}, '5.95')
   */
  callApiSync(a, b, c) {
    return this.rest.get._(a, b, c)
  }

  /**
   * Возвращает залогиненную группу
   * @returns {Promise<Group>} Залогиненная группа
   */
  get me() {
    return new Group(this.myId, this.token)
  }

  /**
   * Для получения информации о группе
   * @param {String} [id=''] Id группы вконтакте
   * @returns {Promise<Group>}
   */
  getGroup(id) {
    return new Group(id, this.token)
  }

  /**
   * Для получения информации о пользователе
   * @param {String} [id=''] Id пользователя вконтакте
   * @returns {Promise<User>}
   */
  getUser(id) {
    return new User(id, this.token)
  }

  /**
   * Для получения информации о диалоге
   * @param {String} [id=''] Id диалога
   * @returns {Promise<Chat>}
   */
  getChat(id) {
    return new Chat(id, this.token)
  }

  /**
   * Для получения сообщения
   * @param {String} [id=''] Id сообщения
   * @returns {Promise<Message>}
   */
  getMessage(id) {
    return new Message(id, this.token)
  }

  /*uploadAudioMessage(path, token) {
    let opts = {
      group_id: this.myId,
      customToken: token
    }
    let resp = this.rest.get._('docs.getWallUploadServer', opts, '5.95')
    if(resp.error)
      return null
    console.log(resp)
    let form = new FormData()
    form.append('file', fs.createReadStream(path))
    form.submit(resp.response.upload_url, function(err, res) {
      res.on('data', function(d) {
        console.log(String(d))
      })
    })
  }*/

  /**
   * Возвращаемые значения сборщика сообщений
   * @callback MessagesCollectorCallback
   * @param {String} [error] Ошибка (если есть)
   * @param {Array} [messages] Массив с собранными сообщениями
   */

  /**
   * Настройки сборщика сообщений (все опции необязательные)
   * @typedef MessagesCollectorOptions
   * @property {Integer} [amount=1] Количество принятых сообщений до отправления их в калбек
   * @property {String} [type=null] Тип сообщения (number или string)
   * @property {User} [author=null] Сборщик будет проверять сообщения на соответствие указанному автору перед сбором его
   * @property {String} [startsWith=null] Проверка того, с чего начинаются сообщения, перед сбором их
   * @property {String} [includes=null] Проверка того, имеют ли сообщения в себе заданный "набор символов", перед сбором их
   * @property {Function} [onEveryMsg=function(message) {}] Активирует данную функцию при обработке каждого сообщения
   * @property {Function} [onWrongMsg=function(message) {}] Активирует данную функцию при обработке не соответствующего требованиям сообщения
   * @property {Function} [onCollectedMsg=function(message) {}] Активирует данную функцию при обработке полностью соответствующего требованиям сообщения
   * @property {Function} [getCollector=function(collector) {}] Активируется при запуске сборщика
   */

  /**
   * Создает умный сборщик сообщений в определенном канале, имеет фильтры сообщений, который будут собираться
   * @param {Chat} [chat] Id чата
   * @param {MessagesCollectorOptions} [options={}] Настройки сборщика
   * @param {MessagesCollectorCallback}
   */
  async createMessagesCollector(chat, opts, callback) {
    let t = this
    let myself = this.me
    let opt = opts || {}
    if(!chat) 
      callback('no chat')
    let options = {
      amount: opt.amount || 1,
      type: opt.type || null,
      startsWith: opt.startsWith || null,
      includes: opt.includes || null,
      onEveryMsg: opt.onEveryMsg || function() {},
      onWrongMsg: opt.onWrongMsg || function() {},
      onCollectedMsg: opt.onCollectedMsg || function() {},
      author: opt.author || null,
      chat: chat.id,
      getCollector: opt.getCollector || function() {},
      trueToEnd: opt.trueToEnd || function() {return false},
      onEnd: opt.onEnd || function() {}
    }
    let collected = []
    let working = true
    let collector = {
      collected: collected,
      stop: function() {
        working = false
        callback(null, collected)
      },
      break: function() {
        working = false
      }
    }
    function newListen() {
      t.once('message', function(m) {
        if(m.authorId != myself.id) {
          if(!options.trueToEnd(m)) {
            options.onEveryMsg(m)

            let completed = {
              type: false,
              startsWith: false,
              includes: false,
              author: false,
              chat: false
            }

            if(m.chatId == options.chat)
              completed.chat = true

            if(options.type) {
              if(options.type == 'number' && parseFloat(m.content) == m.content) {
                completed.type = true
              }
              if(options.type == 'string' && parseFloat(m.content) != m.content) {
                completed.type = true
              }
            } else {
              completed.type = true
            }

            if(options.startsWith) {
              if(m.content.startsWith(options.startsWith)) {
                completed.startsWith = true
              }
            } else {
              completed.startsWith = true
            }

            if(options.includes) {
              if(m.content.includes(options.includes)) {
                completed.includes = true
              }
            } else {
              completed.includes = true
            }

            if(options.author) {
              if(m.authorId == options.author.id) {
                completed.author = true
              }
            } else {
              completed.author = true
            }

            if(
              completed.type &&
              completed.startsWith &&
              completed.includes &&
              completed.author &&
              completed.chat
            ) {
              if(working)
                options.onCollectedMsg(m)
              collected.push(m)
              if(collected.length >= options.amount) {
                callback(null, collected)
                options.onEnd(m)
              } else {
                newListen()
              }
            } else {
              if(completed.chat)
                options.onWrongMsg(m)
              if(working)
                newListen()
            }
          } else {
            working = false
            options.onEnd(m)
          }
        }
      })
    }
    newListen()
  }

  /**
   * Укорачивает ссылку с помощью апи VK
   * @param {String} [url] Оригинальная ссылка
   * @returns {Promise<String>} Сокращенная ссылка
   */
  shortenUrl(url) {
    return new Promise(async function(resolve, reject) {
      let r = await this.rest.async._('utils.getShortLink', {url: url}, '5.95')
      resolve(r.response.short_url)
    })
  }


  /**
   * Отправляет сообщение в данный диалог
   * @param {String} Текст сообщения
   * @param {MessageOptions} Опции сообщения (фотографии и т.д.)
   * @returns {Promise<Message>}
   * @example
   * bot.sendMessage('Привет!', {
    *   map: {
    *     lat: 55.75222,
    *     long: 37.616556
    *   },
    *   attach: ['video-47795388_456239290'],
    *   chat: 123
    * })
    */
   async sendMessage(msg, opts) {
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
         peer_id: opt.chat,
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
         if(opt.keyboard) {
           values.keyboard = encodeURIComponent(JSON.stringify(opt.keyboard))
         }
       }
       t.rest.async._('messages.send', values, '5.95').then(function(resp) {
         resolve(new Message(resp.response, t.token))
       })
     })
   }
}

module.exports = VK