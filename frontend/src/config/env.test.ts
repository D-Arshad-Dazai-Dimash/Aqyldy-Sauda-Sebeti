import {
  config,
  getAiBaseUrl,
  getApiBaseUrl,
  setAiUrl,
  setApiUrl,
} from './env';

describe('config/env URL resolution', () => {
  afterEach(() => {
    setAiUrl('');
    setApiUrl('');
  });

  test('returns app.json extra values by default', () => {
    expect(getApiBaseUrl()).toMatch(/^https?:\/\/[^\/]+$/);
    expect(getAiBaseUrl()).toMatch(/^https?:\/\/[^\/]+$/);
  });

  test('runtime override wins', () => {
    setApiUrl('https://api.example.com/');
    setAiUrl('https://ai.example.com');

    expect(getApiBaseUrl()).toBe('https://api.example.com');
    expect(getAiBaseUrl()).toBe('https://ai.example.com');
  });

  test('config object proxies through getters', () => {
    setApiUrl('https://api2.example.com');
    expect(config.API_URL).toBe('https://api2.example.com');
  });

  test('strips trailing slash', () => {
    setAiUrl('https://ai.example.com/');
    expect(getAiBaseUrl()).toBe('https://ai.example.com');
  });
});
