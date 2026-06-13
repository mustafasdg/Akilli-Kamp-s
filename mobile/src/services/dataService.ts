import apiClient from './apiClient';
import aiClient from './aiClient';
import {
  Announcement, Menu, Location, News, Event, PagedResult,
  Message, ConversationSummary, Teacher, TeacherSchedule,
  Appointment, CreateAppointmentRequest, AppointmentStatus,
  AppNotification, ScheduleRequest, AiChatResponse,
} from '../types/models';

// Backend, DayOfWeek enum'unu JsonStringEnumConverter ile "Monday" gibi string döndürür;
// tüm mobil tüketiciler ise sayısal (0=Pazar … 6=Cumartesi) bekler. Sınırda normalize edilir.
const DAY_NAME_TO_NUM: Record<string, number> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
};

function normalizeDayOfWeek(value: number | string): number {
  if (typeof value === 'number') return value;
  if (value in DAY_NAME_TO_NUM) return DAY_NAME_TO_NUM[value];
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
}

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

  getTeacherSchedules: async (teacherId: number) => {
    const res = await apiClient.get<TeacherSchedule[]>(`/schedules/${teacherId}`);
    res.data = res.data.map(s => ({ ...s, dayOfWeek: normalizeDayOfWeek(s.dayOfWeek) }));
    return res;
  },

  // ── Hoca program yönetimi ─────────────────────────────────────────────────
  createSchedule: (body: ScheduleRequest) =>
    apiClient.post<TeacherSchedule>('/schedules', body),

  updateSchedule: (id: number, body: ScheduleRequest) =>
    apiClient.put<TeacherSchedule>(`/schedules/${id}`, body),

  /** Müsait slotu EkDers olarak işaretle (slot silinmez, güncellenir). */
  markSlotAsEkDers: (id: number, body: { courseName: string; classLocation?: string }) =>
    apiClient.put<TeacherSchedule>(`/schedules/${id}/ekders`, body),

  /** EkDers slotunu Müsait'e sıfırla (CourseName/ClassLocation temizlenir). */
  resetSlot: (id: number) =>
    apiClient.put<TeacherSchedule>(`/schedules/${id}/reset`),

  // ── Mesajlaşma ────────────────────────────────────────────────────────────
  getConversations: () =>
    apiClient.get<ConversationSummary[]>('/messages/conversations'),

  /** Öğretmene özel: randevu almış + mesajlaşmış tüm öğrenciler */
  getTeacherConversations: () =>
    apiClient.get<ConversationSummary[]>('/messages/teacher/conversations'),

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

  updateAppointmentStatus: (
    id: number,
    newStatus: AppointmentStatus,
    reason?: string,
    suggestedTime?: string,
  ) =>
    apiClient.put<void>(`/appointments/${id}/status`, { newStatus, reason, suggestedTime }),

  // ── Bildirimler ───────────────────────────────────────────────────────────
  getMyNotifications: () =>
    apiClient.get<AppNotification[]>('/notifications/mine'),

  markNotificationRead: (id: number) =>
    apiClient.put<void>(`/notifications/${id}/read`),

  // ── AI Asistanı (Python servisi, port 8000) ─────────────────────────────────
  /** Mesajı LangGraph ajanına gönderir. sessionId her kullanıcı için ayrı hafıza tutar. */
  sendAiMessage: (message: string, sessionId: string) =>
    aiClient.post<AiChatResponse>('/chat', { message, session_id: sessionId }),
};
