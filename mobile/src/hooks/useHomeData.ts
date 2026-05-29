import { useState, useEffect, useCallback } from 'react';
import { Announcement, Menu, Location } from '../types/models';
import { dataService } from '../services/dataService';

interface HomeData {
  announcements: Announcement[];
  todayMenu: Menu | null;
  locations: Location[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useHomeData(): HomeData {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [todayMenu, setTodayMenu] = useState<Menu | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [annRes, menuRes, locRes] = await Promise.all([
        dataService.getAnnouncements(1, 3),
        dataService.getMenus(1, 10),
        dataService.getLocations(1, 50),
      ]);

      setAnnouncements(annRes.data.items);
      setLocations(locRes.data.items);

      // En güncel menüyü bul (tarih bugüne en yakın)
      const today = new Date().toDateString();
      const menus = menuRes.data.items;
      const todayMatch = menus.find(
        (m) => new Date(m.tarih).toDateString() === today
      );
      setTodayMenu(todayMatch ?? menus[menus.length - 1] ?? null);
    } catch {
      setError('Veriler yüklenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { announcements, todayMenu, locations, isLoading, error, refresh: fetchAll };
}
