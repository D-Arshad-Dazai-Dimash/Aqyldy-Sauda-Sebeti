import {
  canUseBiometricUnlock,
  changeAppPin,
  verifyAppPin,
} from './appPin';
import * as Keychain from 'react-native-keychain';

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(),
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
  getSupportedBiometryType: jest.fn(),
  ACCESSIBLE: {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  },
  ACCESS_CONTROL: {
    BIOMETRY_ANY_OR_DEVICE_PASSCODE: 'BIOMETRY_ANY_OR_DEVICE_PASSCODE',
  },
}));

describe('appPin utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('verifies saved pin correctly', async () => {
    (Keychain.getGenericPassword as jest.Mock).mockResolvedValue({ username: 'app-pin', password: '1234' });

    await expect(verifyAppPin('1234')).resolves.toBe(true);
    await expect(verifyAppPin('0000')).resolves.toBe(false);
  });

  it('returns false when no biometric type is available', async () => {
    (Keychain.getSupportedBiometryType as jest.Mock).mockResolvedValue(null);

    await expect(canUseBiometricUnlock()).resolves.toBe(false);
  });

  it('changes pin only with valid current pin', async () => {
    (Keychain.getGenericPassword as jest.Mock).mockResolvedValue({ username: 'app-pin', password: '1234' });
    (Keychain.getSupportedBiometryType as jest.Mock).mockResolvedValue('FACE_ID');

    const ok = await changeAppPin('1234', '4321');
    const fail = await changeAppPin('0000', '1111');

    expect(ok).toBe(true);
    expect(fail).toBe(false);
  });
});
