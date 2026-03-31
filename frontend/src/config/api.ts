import { Platform } from 'react-native';

// Android эмулятор -> 10.0.2.2 (хост машинасы)
// Нақты Android телефон -> ПК-ның жергілікті IP-сы (мысалы: 192.168.0.147)
// iOS симулятор -> localhost
const EMULATOR_URL = 'http://10.0.2.2:8080';
const DEVICE_URL = 'http://192.168.0.147:8080';

export const API_BASE_URL = Platform.OS === 'android' ? EMULATOR_URL : 'http://localhost:8080';

// Нақты телефонда тексергенде DEVICE_URL-ді қолданыңыз:
// export const API_BASE_URL = DEVICE_URL;
