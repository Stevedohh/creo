import { apiClient } from '@creo/shared';
import type { AuthResponse, LoginRequest, RegisterRequest, User } from './auth.types';

export function login(data: LoginRequest): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>('/auth/login', data).then((r) => r.data);
}

export function register(data: RegisterRequest): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>('/auth/register', data).then((r) => r.data);
}

export function logout(refreshToken: string): Promise<void> {
  return apiClient.post('/auth/logout', { refreshToken });
}

export function getMe(): Promise<User> {
  return apiClient.get<User>('/auth/me').then((r) => r.data);
}

export function updateLanguage(language: string): Promise<User> {
  return apiClient.patch<User>('/auth/language', { language }).then((r) => r.data);
}
