import { Platform } from 'react-native';

// Конфигурация для различных сред
const ENV = {
  dev: {
    // На реальных устройствах и эмуляторе iOS используем localhost
    // На Android эмуляторе используем 10.0.2.2 (алиас для хоста)
    // На реальном устройстве нужно использовать IP машины разработки
    AI_URL: Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000',
    API_URL: Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080',
  },
  prod: {
    // Для production используй реальные адреса
    AI_URL: 'https://api.aqyldysebet.com',
    API_URL: 'https://api.aqyldysebet.com',
  },
};

// Определяем текущую среду
const CURRENT_ENV = __DEV__ ? 'dev' : 'prod';

export const config = ENV[CURRENT_ENV];

// Для локального тестирования можно переопределить
export function setAIUrl(url: string) {
  config.AI_URL = url;
}

export function setAPIUrl(url: string) {
  config.API_URL = url;
}
