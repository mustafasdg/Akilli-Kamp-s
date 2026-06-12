import apiClient from './apiClient';
import { Announcement, Menu, Location, News, Event, PagedResult } from '../types/models';

export const dataService = {
  getAnnouncements: (page = 1, pageSize = 10) =>
    apiClient.get<PagedResult<Announcement>>('/announcements', { params: { page, pageSize } }),

  getMenus: (page = 1, pageSize = 10) =>
    apiClient.get<PagedResult<Menu>>('/menus', { params: { page, pageSize } }),

  getLocations: (page = 1, pageSize = 50) =>
    apiClient.get<PagedResult<Location>>('/locations', { params: { page, pageSize } }),

  getNews: (page = 1, pageSize = 10) =>
    apiClient.get<PagedResult<News>>('/news', { params: { page, pageSize } }),

  getEvents: (page = 1, pageSize = 10) =>
    apiClient.get<PagedResult<Event>>('/events', { params: { page, pageSize } }),
};
