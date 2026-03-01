export type Role = 'ROLE_USER' | 'ROLE_ADMIN' | 'USER' | 'ADMIN';

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
};

export type AuthResponse = {
  accessToken: string;
  // если backend возвращает role отдельно — добавим
  role?: Role;
};