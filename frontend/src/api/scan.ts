import { api } from './client';
import type { ScanResult } from '../types/api';

export async function scanBarcode(storeId: string, barcode: string): Promise<ScanResult> {
  const res = await api.post<ScanResult>('/api/scan', { storeId, barcode });
  return res.data;
}
