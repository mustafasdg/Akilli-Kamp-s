import apiClient from './apiClient';
import {
  Announcement, Menu, Location, News, Event, PagedResult,
  Message, Teacher, TeacherSchedule,
  Appointment, CreateAppointmentRequest, AppointmentStatus,
} from '../types/models';

export const dataService = {
  // ── Mevcut ────────────────────────────────────────────────────────────────
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

  // ── Akademisyenler ────────────────────────────────────────────────────────
  getTeachers: () =>
    apiClient.get<Teacher[]>('/users', { params: { role: 'teacher' } }),

  getTeacherSchedules: (teacherId: number) =>
    apiClient.get<TeacherSchedule[]>(`/schedules/${teacherId}`),

  // ── Mesajlaşma ────────────────────────────────────────────────────────────
  getConversation: (otherUserId: number) =>
    apiClient.get<Message[]>(`/messages/conversation/${otherUserId}`),

  sendMessage: (receiverId: number, content: string) =>
    apiClient.post<Message>('/messages', { receiverId, content }),

  markAsRead: (senderId: number) =>
    apiClient.put<{ markedAsRead: number }>(`/messages/read/${senderId}`),

  // ── Randevular ────────────────────────────────────────────────────────────
  getMyAppointments: () =>
    apiClient.get<Appointment[]>('/appointments/mine'),

  createAppointment: (body: CreateAppointmentRequest) =>
    apiClient.post<Appointment>('/appointments', body),

  updateAppointmentStatus: (id: number, newStatus: AppointmentStatus) =>
    apiClient.put<void>(`/appointments/${id}/status`, { newStatus }),
};
