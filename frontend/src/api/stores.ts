import { api } from './client';
import type { Store, InventoryItem } from '../types/api';

export async function getStores(): Promise<Store[]> {
  const res = await api.get<Store[]>('/api/stores');
  return res.data;
}

export async function getStore(id: string): Promise<Store> {
  const res = await api.get<Store>(`/api/stores/${id}`);
  return res.data;
}

export async function getStoreInventory(storeId: string): Promise<InventoryItem[]> {
  const res = await api.get<InventoryItem[]>(`/api/stores/${storeId}/inventory`);
  return res.data;
}

export async function getStoreProducts(storeId: string): Promise<InventoryItem[]> {
  const res = await api.get<InventoryItem[]>(`/api/stores/${storeId}/products`);
  return res.data;
}
