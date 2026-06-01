import apiClient from './apiClient';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../types/models';

export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', data);
    return res.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/register', data);
    return res.data;
  },

  me: async (): Promise<User> => {
    const res = await apiClient.get<User>('/auth/me');
    return res.data;
  },

  updateProfile: async (name: string): Promise<User> => {
    const res = await apiClient.patch<User>('/auth/profile', { name });
    return res.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.patch('/auth/password', { currentPassword, newPassword });
  },
};
