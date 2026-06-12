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
  yemek1: string;
  yemek2: string;
  yemek3: string;
  yemek4: string;
  kalori: number;
}

// GET /api/locations
export interface Location {
  id: number;
  binaAdi: string;
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
