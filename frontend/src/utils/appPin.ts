import * as Keychain from 'react-native-keychain';

const APP_PIN_SERVICE = 'aqyldysebet:app-pin';
const APP_PIN_USER = 'app-pin';
const APP_BIO_SERVICE = 'aqyldysebet:app-pin-bio';
const APP_BIO_USER = 'app-pin-bio';

export async function saveAppPin(pin: string): Promise<void> {
  try {
    await Keychain.setGenericPassword(APP_PIN_USER, pin, {
      service: APP_PIN_SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch (e) {
    console.warn('Failed to save PIN to Keychain:', e);
  }
}

export async function hasAppPin(): Promise<boolean> {
  try {
    const creds = await Keychain.getGenericPassword({ service: APP_PIN_SERVICE });
    return Boolean(creds);
  } catch (e) {
    console.warn('Failed to check PIN in Keychain:', e);
    return false;
  }
}

export async function verifyAppPin(pin: string): Promise<boolean> {
  try {
    const creds = await Keychain.getGenericPassword({ service: APP_PIN_SERVICE });
    if (!creds) return false;
    return creds.password === pin;
  } catch (e) {
    console.warn('Failed to verify PIN from Keychain:', e);
    return false;
  }
}

export async function clearAppPin(): Promise<void> {
  try {
    await Keychain.resetGenericPassword({ service: APP_PIN_SERVICE });
  } catch (e) {
    console.warn('Failed to clear PIN from Keychain:', e);
  }
  try {
    await Keychain.resetGenericPassword({ service: APP_BIO_SERVICE });
  } catch (e) {
    console.warn('Failed to clear biometric from Keychain:', e);
  }
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
  try {
    const available = await canUseBiometricUnlock();
    if (!available) return;

    await Keychain.setGenericPassword(APP_BIO_USER, 'enabled', {
      service: APP_BIO_SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
    });
  } catch (e) {
    console.warn('Failed to enable biometric unlock:', e);
  }
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
  try {
    await saveAppPin(pin);
    await enableBiometricUnlock();
  } catch (e) {
    console.warn('Failed to setup PIN:', e);
  }
}

export async function changeAppPin(currentPin: string, nextPin: string): Promise<boolean> {
  try {
    const ok = await verifyAppPin(currentPin);
    if (!ok) return false;

    await setupAppPin(nextPin);
    return true;
  } catch (e) {
    console.warn('Failed to change PIN:', e);
    return false;
  }
}
