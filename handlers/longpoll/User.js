//зависимости

var asyncrestclient = require('../../workers/ApiRequestAsync')
var Chat = require('./Chat')

/**
 * Пользователь Вконтакте
 * @type {Class}
 */
class User {
  constructor(id, token, memberChat) {
    this._token = token
    this._arest = new asyncrestclient(token)
    if(memberChat)
      this.memberOfChatId = memberChat

    let user = id

    /**
     * Имя человека
     * @type {Object}
     * @property {string} [first] Имя
     * @property {string} [last] Фамилия
     */
    this.name = {
      first: user.first_name,
      last: user.last_name
    }

    /**
     * ID пользователя
     * @type {Integer}
     */
    this.id = user.id

    /**
     * Закрыт ли профиль пользователя
     * @type {Integer}
     */
    this.closed = user.is_closed

    /**
     * Псевдоним пользователя
     * @type {String}
     */
    this.nickname = user.nickname

    /**
     * Пол пользователя
     * @type {Integer}
     */
    this.sex = user.sex

    /**
     * Адрес страницы пользователя
     * @type {String}
     */
    this.domain = user.domain

    let havea = true
    if(user.has_photo == 1) 
      havea = false

    /**
     * Аватар пользователя
     * @type {Object}
     * @property {string} [s50] Аватар пользователя 50х50
     * @property {string} [s100] Аватар пользователя 100х100
     * @property {string} [s200] Аватар пользователя 200х200
     * @property {string} [max] Аватар пользователя максимального размера
     * @property {string} [tag] Адрес фото пользователя
     * @property {string} [default] Стандартный ли аватар у пользователя
     */
    this.avatar = {
      s50: user.photo_50,
      s100: user.photo_100,
      s200: user.photo_200,
      max: user.photo_max,
      tag: 'photo' + user.photo_id,
      default: havea
    }

    /**
     * Имеет ли пользователь телефон
     * @type {Boolean}
     */
    this.hasMobile = false
    if(user.has_mobile == 1)
      this.hasMobile = true
    
    
  }

  /**
   * Исключает пользователя из беседы (если он был получен из message)
   */
  async kick() {
    if(this.memberOfChatId) {
      throw new Error('VK.JS: you didn\'t get this member from message property, use kick(userId) function in chat class instead.')
    } else {
      this._arest._('messages.removeChatUser', {chat_id: this.memberOfChatId - 2000000000, member_id: this.id}, '5.95')
    }
  }
}

class LoadingUser {
  constructor(id, token, memberChat) {
    return new Promise(async function(resolve, reject) {
      let r = await new asyncrestclient(token)._('users.get', {user_ids: id, fields: 'photo_id, verified, sex, bdate, city, country, home_town, has_photo, photo_50, photo_100, photo_200_orig, photo_200, photo_400_orig, photo_max, photo_max_orig, online, domain, has_mobile, contacts, site, education, universities, schools, status, last_seen, followers_count, occupation, nickname, relatives, relation, personal, connections, exports, activities, interests, music, movies, tv, books, games, about, quotes, can_post, can_see_all_posts, can_see_audio, can_write_private_message, can_send_friend_request, is_favorite, is_hidden_from_feed, timezone, screen_name, maiden_name, crop_photo, is_friend, friend_status, career, military, blacklisted, blacklisted_by_me'}, '5.95')
      let rr = r.response[0]
      resolve(new User(rr, token, memberChat))
    })
  }
}

module.exports = LoadingUser