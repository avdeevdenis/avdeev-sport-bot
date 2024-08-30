import { debugLog } from 'avdeev-utils';
import { DEBUG_FILEPATH } from '../../entryPoints';

const token = process.env.TELEGRAM_API_TOKEN;
const TelegramBot = require('node-telegram-bot-api');

let AvdeevSportBotInstance = null;

/**
 * Это ID нашего чата в телеграме, куда бот присылает сообщения
 * Получил так — https://stackoverflow.com/a/38388851
 */
const STATIC_CHAT_ID = '-4503094230';

// А это мой ID-шник :)
// const STATIC_CHAT_ID = '348916796';

export const sendTelegramMessage = async (messageText: string): Promise<void> => {
  if (!messageText || !messageText.length) {
    return Promise.resolve();
  }

  if (AvdeevSportBotInstance === null) {
    const AvdeevSportBot = new TelegramBot(token, {
      polling: true
    });

    if (AvdeevSportBot) {
      AvdeevSportBotInstance = AvdeevSportBot;
    }
  }

  await debugLog(DEBUG_FILEPATH, `[sendTelegramMessage] To send message to chatId = '${STATIC_CHAT_ID}' with message = '${messageText}'`);

  /**
   * API https://core.telegram.org/bots/api#sendmessage
   */
  await AvdeevSportBotInstance.sendMessage(STATIC_CHAT_ID, messageText, {
    /**
     * Включаем markdown-разметку
     */
    parse_mode: 'Markdown',
  });

  return Promise.resolve();
};

/**
 * '2022-03-25 10:00:00' => 25.03 10:00
 */
const formatDateString = (dateString) => {
  return dateString.replace(/([0-9]{4})-([0-9]{2})-([0-9]{2})\s([0-9]{2}:[0-9]{2})/, (_all, _year, month, day, time) => {
    return day + '.' + month + '\n' + time;
  });
}

const getMessageWithSlot = (slotText, specialistData) => {
  return '🙋‍♀️ ' + specialistData.fio + '\n' +
    '*' + formatDateString(slotText) + '* | [записаться](' + specialistData.url + ')\n';
};