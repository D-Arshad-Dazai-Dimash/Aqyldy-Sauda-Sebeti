import { Platform } from 'react-native';

// Android emulator uses 10.0.2.2 to reach host machine
// iOS simulator uses localhost
// Real device: replace with your machine's local IP
const DEV_HOST = Platform.select({
  android: '10.0.2.2',
  ios: 'localhost',
  default: 'localhost',
});

export const API_BASE_URL = `http://${DEV_HOST}:8080`;
