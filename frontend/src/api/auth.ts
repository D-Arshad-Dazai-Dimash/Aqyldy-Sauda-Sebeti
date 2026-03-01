import { api } from './client';
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types/auth';

export async function login(data: LoginRequest) {
  const res = await api.post<AuthResponse>('/api/auth/login', data);
  return res.data;
}

export async function register(data: RegisterRequest) {
  const res = await api.post<AuthResponse>('/api/auth/register', data);
  return res.data;
}

export async function me() {
  const res = await api.get('/api/me');
  return res.data; // будет user dto с backend
}