import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

export const sendNetworkRequest = (url: string, config: AxiosRequestConfig): Promise<AxiosResponse> => {
  return new Promise((resolve, reject) => {
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