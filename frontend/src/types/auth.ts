export type Role = 'ROLE_USER' | 'ROLE_ADMIN' | 'USER' | 'ADMIN';

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  name?: string;
};

export type BusinessRegisterRequest = {
  email: string;
  password: string;
  name?: string;
  storeName: string;
  storeAddress?: string;
  phone?: string;
  bin?: string;
  workingHours?: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken?: string;
  role?: Role;
};