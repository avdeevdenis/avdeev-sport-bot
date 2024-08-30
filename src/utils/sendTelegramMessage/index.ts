import { debugLog } from 'avdeev-utils';
import { DEBUG_FILEPATH } from '../../entryPoints';

const token = process.env.TELEGRAM_API_TOKEN;
const TelegramBot = require('node-telegram-bot-api');

let AvdeevSportBotInstance = null;

/**
 * Это ID нашего чата в телеграме, куда бот присылает сообщения
 * Получил так — https://stackoverflow.com/a/38388851
 */
const STATIC_CHAT_ID = process.env.TELEGRAM_SEND_CHAT_ID;

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