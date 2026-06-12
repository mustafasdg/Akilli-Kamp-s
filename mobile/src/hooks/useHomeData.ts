import { useState, useEffect, useCallback } from 'react';
import { Announcement, Location } from '../types/models';
import { dataService } from '../services/dataService';

interface HomeData {
  announcements: Announcement[];
  locations: Location[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useHomeData(): HomeData {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [annRes, locRes] = await Promise.all([
        dataService.getAnnouncements(1, 3),
        dataService.getLocations(1, 50),
      ]);
      setAnnouncements(annRes.data.items);
      setLocations(locRes.data.items);
    } catch {
      setError('Veriler yüklenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { announcements, locations, isLoading, error, refresh: fetchAll };
}
