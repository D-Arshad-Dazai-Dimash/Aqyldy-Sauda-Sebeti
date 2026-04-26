// Конфигурация для различных сред
const ENV = {
  dev: {
    // На реальных устройствах и эмуляторе iOS используем localhost
    // На Android эмуляторе используем 10.0.2.2 (алиас для хоста)
    // На реальном устройстве нужно использовать IP машины разработки
    AI_URL: 'https://aqyldy-sauda-sebeti-iw5jq.ondigitalocean.app/aqyldy-sauda-sebeti-ai-service',
    API_URL: 'https://aqyldy-sauda-sebeti-iw5jq.ondigitalocean.app',
  },
  prod: {
    AI_URL: 'https://aqyldy-sauda-sebeti-iw5jq.ondigitalocean.app/aqyldy-sauda-sebeti-ai-service',
    API_URL: 'https://aqyldy-sauda-sebeti-iw5jq.ondigitalocean.app',
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
