import apiClient from './apiClient';
import { DailyMenu } from '../types/Menu';

export const menuService = {
  getTodayMenu: async (): Promise<DailyMenu> => {
    const res = await apiClient.get<DailyMenu>('/menus/today');
    return res.data;
  },
};
