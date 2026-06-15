// GET /api/menus/today
export interface MenuItem {
  id: number;
  name: string;
  category: string;
  calories: number;
}

export interface DailyMenu {
  id: number;
  date: string; // ISO 8601
  totalCalories: number;
  items: MenuItem[];
  /** Yemekhane o gün kapalıysa (hafta sonu/tatil) true. */
  isClosed: boolean;
  /** Kapalıysa gösterilecek açıklama metni; açıkken gelmez. */
  closingMessage?: string;
}
