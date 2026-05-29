import apiClient from './apiClient';
import { Announcement, Menu, Location, PagedResult } from '../types/models';

export const dataService = {
  getAnnouncements: (page = 1, pageSize = 10) =>
    apiClient.get<PagedResult<Announcement>>('/announcements', { params: { page, pageSize } }),

  getMenus: (page = 1, pageSize = 10) =>
    apiClient.get<PagedResult<Menu>>('/menus', { params: { page, pageSize } }),

  getLocations: (page = 1, pageSize = 50) =>
    apiClient.get<PagedResult<Location>>('/locations', { params: { page, pageSize } }),
};
