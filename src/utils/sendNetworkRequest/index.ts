import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { AxiosResponseYClientsSearchDates, AxiosResponseYClientsFreePlaces, AxiosResponseYClientsCommon } from '../../typings';
import { debugLog } from 'avdeev-utils';
import { DEBUG_FILEPATH } from '../../entryPoints';

// Специфический тип для конкретного проекта/задачи
type AxiosReponseYClients = AxiosResponse & AxiosResponseYClientsCommon & (
  AxiosResponseYClientsSearchDates |
  AxiosResponseYClientsFreePlaces
);

export const sendNetworkRequest = async (url: string, config: AxiosRequestConfig): Promise<AxiosReponseYClients> => {
  return new Promise(async (resolve, reject) => {
    await debugLog(DEBUG_FILEPATH, `[sendNetworkRequest] Send request to '${url}'`);

    axios(url, config)
      .then((response) => {
        if (!response || !response.data) {
          reject(response);
        }

        if (response.status !== 200) {
          reject(new Error('Incorrect status with ' + response.status));
        }

        if (response.statusText === 'OK') {
          resolve(response.data);
        }
      })
      .catch((error) => {
        reject(error);
      })
  });
}