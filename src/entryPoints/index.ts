// Подключаем все process.env переменные
require('dotenv').config();

// https://stackoverflow.com/questions/65289566/node-telegram-bot-api-deprecated-automatic-enabling-of-cancellation-of-promises
process.env.NTBA_FIX_319 = '1';

import { saveFileContent } from '../utils/saveFileContent';
import { getJSONFileContent } from '../utils/getJSONFileContent';
import { sendNetworkRequest } from '../utils/sendNetworkRequest';
import { sendTelegramMessage } from '../utils/sendTelegramMessage';
import { AxiosResponseYClientsSearchDates, AxiosResponseYClientsFreePlaces, SearchDates, FreePlace, AxiosResponseYClientsFreePlaceItem } from '../typings';
import { delay } from '../utils/delay';

/**
 * Пути к файлам, где хранятся данные уже отправленных сообщений с нотификациями в ТГ
 * (с которыми сравниваются новые данные и новые оповещения отправляются только в случае отличия)
 */
const FILE_PATHS_TO_SAVE_DATA = {
  SEARCH_DATES: 'src/savedData/search_dates.json',
  FREE_PLACES: 'src/savedData/free_places.json',
};

const OPTIONS_FOR_HTTP_REQUEST = {
  method: 'GET',
  headers: {
    Accept: 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Authorization': 'Bearer gtcwf654agufy25gsadh',
  },
};

// NOT DDOS!
const TELEGRAM_WAIT_TIME_BETWEEN_MESSAGES_SEND = 400;

const getSearchDatesResponseData = async (): Promise<SearchDates> => {
  const url = 'https://n1194046.yclients.com/api/v1/activity/1086364/search_dates_range';

  return new Promise((resolve, reject) => {
    sendNetworkRequest(url, OPTIONS_FOR_HTTP_REQUEST)
      .then((searchDates: AxiosResponseYClientsSearchDates) => {
        if (!searchDates || !searchDates?.success) {
          reject('Network response does not searchDates.');
        }

        const { data } = searchDates;
        const { min_date: minDate, max_date: maxDate } = data;

        resolve({ minDate, maxDate });
      })
  });
};

const getFreePlacesByDatesRangeResponseData = async (searchDates: SearchDates): Promise<AxiosResponseYClientsFreePlaces['data']> => {
  // Просто большое число, количество свободных мест больше которого вряд ли будут
  const PLACES_COUNT = 200;
  const url = 'https://n1194046.yclients.com/api/v1/activity/1086364/search' +
    '?count=' + PLACES_COUNT +
    '&from=' + searchDates.minDate +
    '&till=' + searchDates.maxDate +
    '&page=1';

  return new Promise((resolve, reject) => {
    sendNetworkRequest(url, OPTIONS_FOR_HTTP_REQUEST)
      .then((freePlacesData: AxiosResponseYClientsFreePlaces) => {
        if (!freePlacesData || !freePlacesData?.success) {
          reject('Network response does not freePlacesData.');
        }

        const { data } = freePlacesData;

        resolve(data);
      })
  });
};

const saveDataToFile = async (filePath: string, dataToSave: Object) => {
  await saveFileContent(filePath, dataToSave);
};

const getNotificationMessageForSearchDates = (searchDatesNow: SearchDates, searchDatesBefore: SearchDates) => {
  const requestUrl = 'https://n1194046.yclients.com/company/1086364/activity/select';

  const message = '🗓️ Доступные для бронирования даты изменились. \n\n' + '- Было: \n' +
    '*' + searchDatesBefore.minDate + ' — ' + searchDatesBefore.maxDate + '*' +
    '\n' + '- Сейчас: \n' +
    '*' + searchDatesNow.minDate + ' — ' + searchDatesNow.maxDate + '*' +
    '\n\n' + '[👉 Посмотреть](' + requestUrl + ')';

  return message;
};

const getNotificationMessageForFreePlaces = (freePlace: FreePlace) => {
  const requestUrl = 'https://n1194046.yclients.com/company/1086364/activity/info/' + freePlace.id;

  const message = '🎾 Появился новый свободный слот для бронирования. \n\n' +
    '*' + freePlace.date + ' — ' + freePlace.courtName + '*' +
    '\n\n' + '[👉 Записаться](' + requestUrl + ')';

  return message;
};

const checkFreePlacesFromDateRange = async (searchDates: SearchDates) => {
  const freePlacesResponseData = await getFreePlacesByDatesRangeResponseData(searchDates);

  if (!freePlacesResponseData) {
    return Promise.resolve();
  }

  // records_count === 0 — значит есть свободные места, если мест нет, число > 0 (ну хер знает, так работает)
  const filteredFreePlacesFromAPI: FreePlace[] = freePlacesResponseData
    .filter(freePlacesResponseItem => freePlacesResponseItem.records_count === 0)
    .map(freePlacesResponseItem => ({
      id: freePlacesResponseItem.id,
      recordsCount: freePlacesResponseItem.records_count,
      date: freePlacesResponseItem.date,
      courtName: freePlacesResponseItem.staff.name,
    }));

  if (!filteredFreePlacesFromAPI.length) {
    return Promise.resolve();
  }

  const filePath = FILE_PATHS_TO_SAVE_DATA.FREE_PLACES;
  const placesFromFile = await getJSONFileContent(filePath);

  if (!placesFromFile) {
    await saveDataToFile(filePath, filteredFreePlacesFromAPI);

    return Promise.resolve();
  }

  /**
   * Сверяем места, сохраненные в файл, и места, что получили новые из API — есть ли новые?
   */
  const getNewFreePlaces = (placesFromFile: FreePlace[], freePlacesFromAPI: FreePlace[]) => {
    return freePlacesFromAPI
      .filter(freePlaceFromAPI => {
        return !placesFromFile.some(placeFromFile => placeFromFile.id === freePlaceFromAPI.id);
      });
  };

  const newFreePlaces = getNewFreePlaces(placesFromFile, filteredFreePlacesFromAPI);

  if (!newFreePlaces.length) {
    return Promise.resolve();
  }

  for (let i = 0; i < newFreePlaces.length; i++) {
    const freePlace = newFreePlaces[i];
    await sendTelegramMessage(getNotificationMessageForFreePlaces(freePlace));

    // NOT DDOS!
    await delay(TELEGRAM_WAIT_TIME_BETWEEN_MESSAGES_SEND);
  }

  const allPlaces = [...placesFromFile, ...newFreePlaces];
  await saveDataToFile(filePath, allPlaces);
};

export const run = async () => {
  await getSearchDatesResponseData()
    .then(async (searchDatesFromAPI) => {
      const filePath = FILE_PATHS_TO_SAVE_DATA.SEARCH_DATES;
      const searchDatesFromFile = await getJSONFileContent(filePath);

      if (!searchDatesFromFile) {
        await saveDataToFile(filePath, searchDatesFromAPI);

        return Promise.resolve();
      }

      const checkIsEquealContent = (contentA, contentB) => {
        return JSON.stringify(contentA) === JSON.stringify(contentB);
      };

      const isEqualContent = checkIsEquealContent(searchDatesFromFile, searchDatesFromAPI);

      if (isEqualContent) {
        return Promise.resolve();
      }

      const isOnlyMinDateUpdated = searchDatesFromAPI.minDate !== searchDatesFromFile.minDate;

      /**
       * Не интересно получать оповещения, где меняется мин. дата вида:
       * 
       * 🎾 Доступные для бронирования даты изменились. 
       * - Было: 
       * 2024-08-29 — 2024-09-03
       * - Сейчас: 
       * 2024-08-30 — 2024-09-03
       */
      if (!isOnlyMinDateUpdated) {
        await sendTelegramMessage(getNotificationMessageForSearchDates(searchDatesFromAPI, searchDatesFromFile));

        await saveDataToFile(filePath, searchDatesFromAPI);
      }

      await checkFreePlacesFromDateRange(searchDatesFromAPI);
    });
}