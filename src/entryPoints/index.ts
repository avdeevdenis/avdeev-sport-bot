require('dotenv').config();

// https://stackoverflow.com/questions/65289566/node-telegram-bot-api-deprecated-automatic-enabling-of-cancellation-of-promises
process.env.NTBA_FIX_319 = '1';

import { saveFileContent } from '../utils/saveFileContent';
import { getJSONFileContent } from '../utils/getJSONFileContent';
import { sendNetworkRequest } from '../utils/sendNetworkRequest';
import { sendTelegramMessage } from '../utils/sendTelegramMessage';

type SearchDates = {
  minDate: string;
  maxDate: string;
};

const STATIC_FILE_PATH_TO_SAVE_DATA = 'src/savedData/search_dates.json';

const getSearchDates = async (): Promise<SearchDates> => {
  const url = 'https://n1194046.yclients.com/api/v1/activity/1086364/search_dates_range';

  const options = {
    method: 'GET',
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Authorization': 'Bearer gtcwf654agufy25gsadh',
    },
  };

  return new Promise((resolve, reject) => {
    sendNetworkRequest(url, options)
      .then(searchDates => {
        if (!searchDates) {
          reject('Network response does not searchDates.');
        }

        const { data } = searchDates;
        const { min_date: minDate, max_date: maxDate } = data;

        resolve({ minDate, maxDate });
      })
  });
};

const getSearchDatesFromFile = async () => {
  const fileContent = getJSONFileContent(STATIC_FILE_PATH_TO_SAVE_DATA);

  if (typeof fileContent === 'string') {
    return JSON.parse(fileContent);
  }

  return fileContent;
};

const saveSearchDatesToFile = async (searchDates: SearchDates) => {
  await saveFileContent(STATIC_FILE_PATH_TO_SAVE_DATA, searchDates);
};

const compareContents = (contentA, contentB) => {
  return JSON.stringify(contentA) === JSON.stringify(contentB);
};

const getNotificationMessage = (searchDatesNow, searchDatesBefore) => {
  const requestUrl = 'https://n1194046.yclients.com/company/1086364/activity/select';

  const message = '🎾 Доступные для бронирования даты изменились. \n\n' + '- Было: \n' +
    '*' + searchDatesBefore.minDate + ' — ' + searchDatesBefore.maxDate + '*' +
    '\n' + '- Сейчас: \n' +
    '*' + searchDatesNow.minDate + ' — ' + searchDatesNow.maxDate + '*' +
    '\n\n' + '[👉 Записаться](' + requestUrl + ')';

  return message;
};

export const run = async () => {
  await getSearchDates()
    .then(async (searchDates) => {
      const searchDatesFromFile = await getSearchDatesFromFile();

      if (!searchDatesFromFile) {
        await saveSearchDatesToFile(searchDates);
      } else {
        const isEqualContent = compareContents(searchDatesFromFile, searchDates);

        if (!isEqualContent) {
          await sendTelegramMessage(getNotificationMessage(searchDates, searchDatesFromFile));
          await saveSearchDatesToFile(searchDates);
        }
      }
    });
}