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
