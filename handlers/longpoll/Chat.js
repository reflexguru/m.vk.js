//зависимости

var asyncrestclient = require('../../workers/ApiRequestAsync')
var Message = require('./Message')
var User = require('./User')

/**
 * Диалог, в котором присутствует сообщество
 * @type {Class}
 */
class Chat {
  constructor(id, token) {
    this._exception = function(note, id = this.clientId) {
      if(id) {
        throw new Error('VK.JS exception from ' + id + ': ' + note)
      } else {
        throw new Error('VK.JS exception: ' + note)
      }
    }
    this._arest = new asyncrestclient(token)
    this._token = token

    let chat = id
    if(!chat) return

    /**
     * Значения чтений сообщений
     * @type {Object}
     */
    this.read = {
      /**
       * Значение чтения сообщений
       * @type {Integer}
       */
      in: chat.in_read,
      /**
       * Значение чтения сообщений
       * @type {Integer}
       */
      out: chat.out_read
    }
    /**
     * ID самого нового сообщения в диалоге
     * @type {Integer}
     */
    this.lastMessageId = chat.last_message_id

    /**
     * ID диалога
     * @type {Integer}
     */
    this.id = chat.peer.id

    /**
     * Тип диалоги
     * @type {String}
     */
    this.chattype = chat.peer.type

    if(chat.chat_settings) {
      /**
       * Название диалога
       * @type {String}
       */
      this.name = chat.chat_settings.title
      /**
       * Количество участников в диалоге
       * @type {Integer}
       */
      this.membersCount = chat.chat_settings.members_count
      /**
       * Является ли диалог каналом
       * @type {Boolean}
       */
      this.channel = chat.chat_settings.is_group_channel
      /**
       * ID основателя диалога
       * @type {Integer}
       */
      this.ownerId = chat.chat_settings.owner_id
      /**
       * Участники диалога
       * @type {Array}
       */
      this.members = chat.chat_settings.active_members
      /**
       * Разрешения группы в чате, названия такие же, какие выдает vk api, за исключением типа представления их (can_invite > canInvite)
       * @type {String}
       */
      this.permissions = {
        canInvite: chat.chat_settings.acl.can_invite,
        canChangeInfo: chat.chat_settings.acl.can_change_info,
        canChangePin: chat.chat_settings.acl.can_change_pin,
        canPromoteUsers: chat.chat_settings.acl.can_promote_users,
        canSeeInviteLink: chat.chat_settings.acl.can_see_invite_link,
        canChangeInviteLink: chat.chat_settings.acl.can_change_invite_link
      }
    }
  }

  /**
   * Опции для сообщения
   * @typedef {Object} MessageOptions
   * @property {array} [attachments=none] Прикрепления (фото, видео и другое) в виде: photo-(id)_(id)
   * @property {integer} [sticker=none] ID стикера, который будет отправлен в виде сообщения (другие виды прикреплений и текст не будут учтены при использовании стикера)
   * @property {float} [map.lat=none] Широта карты, которая будет прикреплена к сообщению, если вы ее укажете
   * @property {float} [map.long=none] Долгота карты, которая будет прикреплена к сообщению, если вы ее укажете
   */
  get user() {
    return new User(this.peerId, this._token)
  }

  
  /**
   * Выдает основателя диалога (если это чат, иначе выдаст null)
   * @returns {Promise<User>}
   */
  get owner() {
    if(this.name) {
      return new User(this.ownerId, this._token)
    } else {
      return null
    }
  }

  /**
   * Отправляет сообщение в данный диалог
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
  async send(msg, opts) {
    let t = this
    let opt = opts
    let m = msg
    return new Promise(function(resolve, reject) {
      Message = require('./Message')
      let txt
      if(typeof m != 'object') {
        txt = m
      } else {
        opt = m
        txt = ''
      }
      let sent = false
      let values = {
        peer_id: t.id,
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
      t._arest._('messages.send', values, '5.103').then(function(resp) {
        resolve(new Message(resp.response, t._token))
      })
    })
  }

  /**
   * Помечает диалог как прочитанный
   */
  async readMark() {
    this._arest._('messages.markAsRead', {peer_id: this.id}, '5.95')
  }

  /**
   * Открепить сообщение
   */
  async unpin() {
    this._arest._('messages.unpin', {peer_id: this.id}, '5.95')
  }

  /**
   * Сообщить чату, что вы выполняете набор текста
   * @param {String} [type=text] Тип наборе текста (text или audio)
   */
  async type(type) {
    if(type == 'text') {
      this._arest._('messages.setActivity', {peer_id: this.id, type: 'typing'}, '5.95')
    } else if(type = 'audio') {
      this._arest._('messages.setActivity', {peer_id: this.id, type: 'audiomessage'}, '5.95')
    } else {
      throw new Error('VK.JS exception: invalid activity type, can be text or audio')
    }
  }

  /**
   * Изменяет название чата (если есть разрешение)
   * @param {String} [name] название
   */
  async setName(name) {
    this._arest._('messages.editChat', {chat_id: this.id - 2000000000, title: name}, '5.95')
  }

  /**
   * Исключает пользователя из беседы (если он был получен из message)
   * @param {String} [id] id юзера
   */
  async kick(id) {
    this._arest._('messages.removeChatUser', {chat_id: this.memberOfChatId - 2000000000, member_id: id}, '5.95')
  }
}

class LoadingChat {
  constructor(id, token) {
    return new Promise(async function(resolve, reject) {
      let r = await new asyncrestclient(token)._('messages.getConversationsById', {peer_ids: id, extended: 1}, '5.95')
      let rr = r.response.items[0]
      resolve(new Chat(rr, token))
    })
  }
}

module.exports = LoadingChat