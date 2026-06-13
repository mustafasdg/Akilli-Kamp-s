// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

// ─── Data models (API field names → camelCase) ────────────────────────────────

// GET /api/announcements
export interface Announcement {
  id: number;
  baslik: string;
  icerik: string;
  tarih: string;
  kategori: string;
}

// GET /api/news
export interface News {
  id: number;
  baslik: string;
  icerik: string;
  tarih: string;
  kategori: string;
}

// GET /api/events
export interface Event {
  id: number;
  baslik: string;
  icerik: string;
  tarih: string;
  kategori: string;
  locationId?: number;
}

// GET /api/menus
export interface Menu {
  id: number;
  tarih: string;
  yemek_1: string;
  yemek_2: string;
  yemek_3: string;
  yemek_4: string;
  kalori: number;
}

// GET /api/locations
export interface Location {
  id: number;
  bina_Adi: string;
  enlem: number;
  boylam: number;
  aciklama: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
}

// ─── Messaging ────────────────────────────────────────────────────────────────

// Sistem mesajına bağlı randevunun GÜNCEL durumu (backend her istekte taze çeker).
export interface AppointmentInfo {
  id: number;
  appointmentDate: string; // ISO 8601
  /** 0 = Pending, 1 = Approved, 2 = Rejected */
  status: number;
  description?: string;
  teacherName: string;
  studentName: string;
  /** Randevu reddedildiyse hocanın girdiği sebep / önerilen saat */
  rejectionReason?: string | null;
}

// GET /api/messages/conversation/{otherUserId}
export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: string;   // ISO 8601
  isRead: boolean;
  /** Sistem mesajı (interaktif randevu kartı) ise true */
  isSystemMessage: boolean;
  relatedAppointmentId?: number | null;
  /** Yalnızca sistem mesajlarında dolu; randevunun güncel durumunu taşır */
  relatedAppointment?: AppointmentInfo | null;
}

// GET /api/messages/conversations  veya  GET /api/messages/teacher/conversations
export interface ConversationSummary {
  partnerId: number;
  partnerName: string;
  lastMessage: string;
  lastMessageTime: string; // ISO 8601
  unreadCount: number;
}

// ─── Academic Staff ───────────────────────────────────────────────────────────

/** Akademisyenin şu anki (anlık saat dilimine göre) durumu — useTeachers istemci tarafında hesaplar. */
export interface TeacherLiveStatus {
  /** 'Şu an Müsait' | 'Şu an Derste' | 'Müsait Değil' */
  label: string;
  /** true → yeşil/mavi (müsait), false → kırmızı (derste/dolu/mesai dışı) */
  available: boolean;
}

// GET /api/users?role=teacher
export interface Teacher {
  id: number;
  name: string;
  email: string;
  role: string;
  /** Backend'e eklenirse dolar, yoksa email domain'den türetilir */
  department?: string;
  bio?: string;
  officeLocation?: string;
  researchAreas?: string;
  /** Öğretim üyesinin oda numarası */
  roomNumber?: string;
  /** Öğretim üyesinin uzmanlık alanı */
  specialty?: string;
  /** useTeachers tarafından anlık (şu anki saat dilimine göre) hesaplanır */
  currentStatus?: TeacherLiveStatus;
}

// GET /api/schedules/{teacherId}
export interface TeacherSchedule {
  id: number;
  teacherId: number;
  /** 0 = Pazar … 6 = Cumartesi (DayOfWeek enum) */
  dayOfWeek: number;
  startTime: string;   // "HH:mm:ss"
  endTime: string;
  isAvailable: boolean;
  /** Katmanlı tip: Müsait | Ders | EkDers */
  type: 'Müsait' | 'Ders' | 'EkDers';
  courseName?: string | null;
  classLocation?: string | null;
}

// ─── Appointments ─────────────────────────────────────────────────────────────

export enum AppointmentStatus {
  Pending  = 0,
  Approved = 1,
  Rejected = 2,
}

// GET /api/appointments/mine
export interface Appointment {
  id: number;
  studentId: number;
  studentName: string;
  teacherId: number;
  teacherName: string;
  scheduleId?: number;
  appointmentDate: string;   // ISO 8601
  status: AppointmentStatus;
  description: string;
  createdAt: string;
  /** Red akışı: hocanın belirttiği sebep ve önerdiği yeni saat */
  rejectionReason?: string | null;
  suggestedTime?: string | null;
}

export interface CreateAppointmentRequest {
  teacherId: number;
  scheduleId?: number;
  appointmentDate: string;   // ISO 8601
  description: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────

// GET /api/notifications/mine
export interface AppNotification {
  id: number;
  title: string;
  body: string;
  appointmentId?: number | null;
  isRead: boolean;
  createdAt: string;
}

// POST/PUT /api/schedules
export interface ScheduleRequest {
  dayOfWeek: number;
  startTime: string;   // "HH:mm:ss"
  endTime: string;
  isAvailable?: boolean;
  type?: 'Müsait' | 'EkDers';
  courseName?: string;
  classLocation?: string;
}

// ─── AI Asistanı (Python LangGraph servisi, port 8000) ────────────────────────

// POST /chat  (ai_service)
export interface AiChatRequest {
  message: string;
  /** Her kullanıcı için ayrı hafıza: genelde `user-{userId}` */
  session_id: string;
}

/** Ajanın o istekte arka planda çağırdığı araçlar (geliştirme/hata ayıklama). */
export interface AiDebugInfo {
  tools_called: string[];
}

export interface AiChatResponse {
  reply: string;
  debug_info: AiDebugInfo;
}
