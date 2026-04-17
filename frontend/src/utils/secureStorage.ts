import * as Keychain from 'react-native-keychain';
import { safeJsonParse } from './storage';

const CARDS_SERVICE = 'aqyldy_saved_cards';

export interface SavedCard {
  id: string;
  last4: string;
  brand: string;
  expiry: string;
}

export async function saveCards(cards: SavedCard[]): Promise<void> {
  await Keychain.setGenericPassword('cards', JSON.stringify(cards), {
    service: CARDS_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
  });
}

export async function loadCards(): Promise<SavedCard[]> {
  try {
    const creds = await Keychain.getGenericPassword({ service: CARDS_SERVICE });
    if (!creds) return [];
    return safeJsonParse<SavedCard[]>(creds.password, []);
  } catch {
    return [];
  }
}

export async function clearCards(): Promise<void> {
  await Keychain.resetGenericPassword({ service: CARDS_SERVICE });
}