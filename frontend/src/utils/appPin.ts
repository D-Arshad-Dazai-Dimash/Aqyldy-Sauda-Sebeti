import * as Keychain from 'react-native-keychain';

const APP_PIN_SERVICE = 'aqyldysebet:app-pin';
const APP_PIN_USER = 'app-pin';
const APP_BIO_SERVICE = 'aqyldysebet:app-pin-bio';
const APP_BIO_USER = 'app-pin-bio';

export async function saveAppPin(pin: string): Promise<void> {
  await Keychain.setGenericPassword(APP_PIN_USER, pin, {
    service: APP_PIN_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function hasAppPin(): Promise<boolean> {
  const creds = await Keychain.getGenericPassword({ service: APP_PIN_SERVICE });
  return Boolean(creds);
}

export async function verifyAppPin(pin: string): Promise<boolean> {
  const creds = await Keychain.getGenericPassword({ service: APP_PIN_SERVICE });
  if (!creds) return false;
  return creds.password === pin;
}

export async function clearAppPin(): Promise<void> {
  await Keychain.resetGenericPassword({ service: APP_PIN_SERVICE });
  await Keychain.resetGenericPassword({ service: APP_BIO_SERVICE });
}

export async function canUseBiometricUnlock(): Promise<boolean> {
  try {
    const type = await Keychain.getSupportedBiometryType();
    return Boolean(type);
  } catch {
    return false;
  }
}

export async function enableBiometricUnlock(): Promise<void> {
  const available = await canUseBiometricUnlock();
  if (!available) return;

  await Keychain.setGenericPassword(APP_BIO_USER, 'enabled', {
    service: APP_BIO_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
  });
}

export async function authenticateWithBiometric(): Promise<boolean> {
  try {
    const creds = await Keychain.getGenericPassword({
      service: APP_BIO_SERVICE,
      authenticationPrompt: {
        title: 'Қолданбаға кіру',
        subtitle: 'Биометриямен растаңыз',
        description: 'Жылдам кіру үшін биометрияны қолданыңыз',
      },
    });

    return Boolean(creds);
  } catch {
    return false;
  }
}

export async function setupAppPin(pin: string): Promise<void> {
  await saveAppPin(pin);
  await enableBiometricUnlock();
}

export async function changeAppPin(currentPin: string, nextPin: string): Promise<boolean> {
  const ok = await verifyAppPin(currentPin);
  if (!ok) return false;

  await setupAppPin(nextPin);
  return true;
}
