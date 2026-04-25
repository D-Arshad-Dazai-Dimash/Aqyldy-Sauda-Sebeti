describe('api config device connectivity', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('uses emulator url on android by default', () => {
    jest.doMock('react-native', () => ({ Platform: { OS: 'android' } }));
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cfg = require('./api');
    expect(cfg.API_BASE_URL).toBe('http://10.0.2.2:8080');
  });

  it('uses localhost on ios simulator by default', () => {
    jest.doMock('react-native', () => ({ Platform: { OS: 'ios' } }));
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cfg = require('./api');
    expect(cfg.API_BASE_URL).toBe('http://localhost:8080');
  });

  it('exposes google maps key constant placeholder', () => {
    jest.doMock('react-native', () => ({ Platform: { OS: 'android' } }));
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cfg = require('./api');
    expect(cfg).toHaveProperty('GOOGLE_MAPS_API_KEY');
    expect(typeof cfg.GOOGLE_MAPS_API_KEY).toBe('string');
  });
});
