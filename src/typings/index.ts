// Специфический тип для конкретного проекта/задачи
export type AxiosResponseYClientsCommon = {
  success: boolean;
};

// Ответ от Бекенда YClients для запроса за возможными датами для записи
export type AxiosResponseYClientsSearchDates = AxiosResponseYClientsCommon & {
  data: {
    // Минимальная возможная дата, доступная для бронирования
    min_date: string;
    // Максимально возможная дата, доступная для бронирования
    max_date: string;
  }
};

export type SearchDates = {
  minDate: AxiosResponseYClientsSearchDates['data']['min_date'];
  maxDate: AxiosResponseYClientsSearchDates['data']['max_date'];
};

// Ответ от Бекенда YClients для запроса за свободными слотами для записи по датам
export type AxiosResponseYClientsFreePlaces = AxiosResponseYClientsCommon & {
  data: AxiosResponseYClientsFreePlaceItem[];
};

export type AxiosResponseYClientsFreePlaceItem = {
  // records_count === 0 — значит есть свободные места, если мест нет, число > 0 (ну хер знает, так работает)
  records_count: number;
  id: number;
  date: string;
  staff: {
    // Просто название корта
    name: string;
  }
};

export type FreePlace = {
  recordsCount: AxiosResponseYClientsFreePlaceItem['records_count'],
  id: AxiosResponseYClientsFreePlaceItem['id'],
  date: AxiosResponseYClientsFreePlaceItem['date'],
  courtName: AxiosResponseYClientsFreePlaceItem['staff']['name'],
};

export type FreePlacesData = FreePlace[];