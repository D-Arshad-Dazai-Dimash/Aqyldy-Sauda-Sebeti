import { api } from './client';
import type { AuthResponse, BusinessRegisterRequest, LoginRequest, RegisterRequest } from '../types/auth';
import type { User } from '../types/api';

type UpdateProfileRequest = {
  name?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
};

export async function login(data: LoginRequest) {
  const res = await api.post<AuthResponse>('/api/auth/login', data);
  return res.data;
}

export async function register(data: RegisterRequest) {
  const res = await api.post<AuthResponse>('/api/auth/register', data);
  return res.data;
}

export async function registerBusiness(data: BusinessRegisterRequest) {
  const res = await api.post<AuthResponse>('/api/auth/register/business', data);
  return res.data;
}

export async function me(): Promise<User> {
  const res = await api.get<User>('/api/me');
  return res.data;
}

export async function updateProfile(data: UpdateProfileRequest): Promise<User> {
  const res = await api.put<User>('/api/me', data);
  return res.data;
}