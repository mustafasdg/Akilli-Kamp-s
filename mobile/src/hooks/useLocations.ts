import { useState, useCallback, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { Location, PagedResult } from '../types/models';

interface UseLocationsResult {
  locations: Location[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useLocations(): UseLocationsResult {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<PagedResult<Location>>('/locations', {
        params: { page: 1, pageSize: 100 },
      });
      setLocations(res.data.items);
    } catch {
      setError('Konumlar yüklenemedi. Lütfen tekrar deneyin.');
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { locations, loading, error, refresh };
}
