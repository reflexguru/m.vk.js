//зависимости

var asyncrestclient = require('../../workers/ApiRequestAsync')

class Group {
  constructor(id, token) {
    this._token = token
    
    let grp = id

    /**
     * ID группы
     * @type {Integer}
     */
    this.id = grp.id

    /**
     * Название
     * @type {String}
     */
    this.name = grp.name

    /**
     * Название группы в ее адресе
     * @type {String}
     */
    this.domain = grp.screen_name

    /**
     * Закрыта ли группа
     * @type {Boolean}
     */
    this.closed = grp.is_closed > 0
    let types = [
      'open',
      'closed',
      'inviteonly',
    ]

    /**
     * Тип доступности группы (open, closed, inviteonly)
     * @type {String}
     */
    this.openType = types[grp.is_closed]

    /**
     * Тип группы (паблик, группа)
     * @type {String}
     */
    this.type = grp.type

    /**
     * Описание группы
     * @type {String}
     */
    this.description = grp.description

    /**
     * Количество участников в группе
     * @type {String}
     */
    this.membersCount = grp.members_count

    /**
     * Дата создания группы
     * @type {Date}
     */
    this.created = new Date(grp.start_date)

    /**
     * Название доступности группы
     * @type {String}
     */
    this.category = grp.activity

    /**
     * Статус группы
     * @type {String}
     */
    this.status = grp.status

    /**
     * Проверена ли группа администрацией вк
     * @type {String}
     */
    this.verified = grp.verified == 1

    /**
     * Название группы в ее адресе (не путать с тегом, это разные вещи)
     * @type {String}
     */
    this.webPage = grp.site

    /**
     * Аватарка чего-либо
     * @typedef {Avatar}
     * @property {URL} [s50] Ссылка на аватар в размере 50 пикселей
     * @property {URL} [s100] Ссылка на аватар в размере 100 пикселей
     * @property {URL} [s200] Ссылка на аватар в размере 200 пикселей
     * @property {URL} [max] Ссылка на аватар в максимальном размере
     */

    /**
     * Аватарка группы
     * @type {Avatar}
     */
    this.avatar = {
      s50: grp.photo_50,
      s100: grp.photo_100,
      s200: grp.photo_200
    }

    /**
     * Страна группы
     * @type {String}
     */
    this.country = grp.country

    /**
     * Магазин в группе
     * @typedef {GroupMarket}
     * @property {Boolean} [enabled] Включен ли маркет
     * @property {Object} [price] .min и .max цены
     * @property {Integer} [contactId] ID контакта магазина
     * @property {Object} [currency] Валюта магаина (имеет .id и .name)
     */

    if(grp.market) {
      /**
       * Магазин группы
       * @type {GroupMarket}
       */
      this.market = {
        enabled: grp.market.enabled == 1,
        price: {
          min: grp.market.price_min,
          max: grp.market.price_max
        },
        contactId: grp.market.contact_id,
        currency: grp.market.currency,
      }
    }

    /**
     * Статистика групп
     * @typedef {GroupStats}
     * @property {Integer} [photos]
     * @property {Integer} [albums]
     * @property {Integer} [topics]
     * @property {Integer} [videos]
     * @property {Integer} [audios]
     * @property {Integer} [docs]
     * @property {Integer} [market]
     */

    /**
     * Статистика группы
     * @type {GroupStats}
     */
    this.stats = grp.counters

    if(grp.contacts) {
      /**
       * Контакты
       * @type {Object} Проперти - ID пользователей, внутри есть .description
       */
      this.contacts = {}
      for(let i = 0; i < grp.contacts.length; i++) {
        this.contacts[grp.contacts[i].user_id] = {
          description: grp.contacts[i].desc
        }
      }
    }

    /**
     * Ссылка в группе
     * @typedef {GroupLink}
     * @property {Integer} [id] ID ссылки
     * @property {String} [url] URL ссылки
     * @property {String} [name] Название ссылки
     * @property {String} [desc] Описание ссылки
     * @property {URL} [photo_50]
     * @property {URL} [photo_100]
     */

    /**
     * Ссылки
     * @type {Array} Ссылки в группе
     */
    this.links = grp.links
  }

  /**
   * Изменяет статус онлайна в группе
   * @param {Boolean} [boolean]
   */
  setOnline(bool) {
    new asyncrestclient(token)._(bool ? 'groups.enableOnline' : 'groups.disableOnline', {group_id: this.id}, '5.95')
  }

  /**
   * Статус онлайна в группе
   * @type {Promise<Boolean>}
   */
  get online() {
    let t = this
    return new Promise(async function(resolve, reject) {
      let r = await new asyncrestclient(t._token)._('groups.getOnlineStatus', {group_id: t.id}, '5.95')
      let st = r.response.status
      resolve(r.response.status == 'none' ? false : true)
    })
  }
}

class LoadingGroup {
  constructor(id, token) {
    return new Promise(async function(resolve, reject) {
      let r = await new asyncrestclient(token)._('groups.getById', {group_id: id, fields: 'city,country,place,description,wiki_page,market,members_count,counters,start_date,finish_date,activity,status,contacts,links,fixed_post,verified,site,ban_info,cover'}, '5.95')
      let rr = r.response[0]
      resolve(new Group(rr, token))
    })
  }
}

module.exports = LoadingGroup