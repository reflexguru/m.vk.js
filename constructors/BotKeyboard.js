/**
 * Конструктор клавиатур для диалога человека с сообществом
 * @type {Class}
 */
class RichKeyboard {
  constructor() {
    /**
     * Кнопка в клавиатуре
     * @typedef {Object} RichKeyboardButton
     * @property {string} [color=none] Цвет кнопки
     * @property {string} [label=none] Текст кнопки
     */

    /**
     * Массив с массивами (строками), в которых содержатся кнопки
     * @type {Object}
     */
    this.buttons = []

    /**
     * Определяет, исчезнет ли клавиатура после ее использования
     * @type {Boolean}
     */
    this.one_time = true
  }

  /**
   * Определяет, исчезнет ли клавиатура после ее использования
   * @param {Boolean}
   * @returns {RichKeyboard}
   */
  oneTime(boolean) {
    this.one_time = boolean
    return this
  }

  /**
   * Создает текстовую кнопку на данной строке
   * @param {String} [text] Текст кнопки
   * @param {String} [color] Цвет кнопки
   * @param {Object} [payload] Команда кнопки
   * @returns {RichKeyboard}
   */
  textbutton(text, color, payload) {
    if(this.buttons.length == 0) {
      this.buttons[0] = []
    }
    this.buttons[this.buttons.length-1].push({
      color: color,
      action: {
        type: 'text',
        payload: JSON.stringify(payload),
        label: text
      }
    })
    return this
  }

  /**
   * Создает кнопку для отправки местоположения на данной строке, может быть только единственной на строке
   * @param {Object} [payload] Команда кнопки
   * @returns {RichKeyboard}
   */
  locationButton(payload) {
    if(this.buttons.length == 0) {
      this.buttons[0] = []
    }
    this.buttons[this.buttons.length-1].push({
      action: {
        type: 'location',
        payload: JSON.stringify(payload)
      }
    })
    return this
  }

  /**
   * Создает кнопку VK Pay на данной строке, может быть только единственной на строке
   * @param {Object} [hash] Параметры перевода VK Pay (https://vk.com/dev/vk_pay_actions)
   * @param {Object} [payload] Команда кнопки
   * @returns {RichKeyboard}
   */
  payButton(hash, payload) {
    if(this.buttons.length == 0) {
      this.buttons[0] = []
    }

    let newopts = ''

    Object.entries(hash).forEach(function(opt) {
      console.log(opt)
      newopts += `${newopts.length ? '&' : ''}${opt[0]}=${opt[1]}`
    })

    console.log(newopts)

    this.buttons[this.buttons.length-1].push({
      action: {
        type: 'vkpay',
        payload: JSON.stringify(payload),
        hash: newopts
      }
    })
    return this
  }

  /**
   * Создает кнопку для открытия приложение VK Apps на данной строке, может быть только единственной на строке
   * @param {String} [text] Текст кнопки
   * @param {Integer} [appid] ID приложения
   * @param {Object} [payload] Команда кнопки
   * @param {String} [hash] Hash приложения (находится после # в ссылке на него) (необязательно, поставьте false, если не хотите задавать)
   * @param {Integer} [ownid] Идентификатор сообщества, если требуется открыть в его контексте (необязательно)
   * @returns {RichKeyboard}
   */
  appButton(text, appid, payload, hash, ownid) {
    if(this.buttons.length == 0) {
      this.buttons[0] = []
    }

    let tp = {
      action: {
        type: 'open_app',
        app_id: appid,
        label: text,
        payload: JSON.stringify(payload)
      }
    }

    if(hash)
      tp.hash = hash

    if(ownid)
      tp.owner_id = ownid

    this.buttons[this.buttons.length-1].push(tp)
    return this
  }

  /**
   * Создает новую строку
   * @returns {RichKeyboard}
   */
  row() {
    this.buttons.push([])
    return this
  }
}

module.exports = RichKeyboard