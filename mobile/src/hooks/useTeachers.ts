import { useState, useCallback, useEffect } from 'react';
import { Teacher } from '../types/models';
import { dataService } from '../services/dataService';

interface UseTeachersResult {
  teachers: Teacher[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useTeachers(): UseTeachersResult {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const teachersRes = await dataService.getTeachers();
      const list = teachersRes.data;

      const todayDow = new Date().getDay(); // 0 Pazar … 6 Cumartesi

      // Tüm hocaların programlarını paralel olarak çek
      const scheduleResults = await Promise.allSettled(
        list.map(t => dataService.getTeacherSchedules(t.id))
      );

      const enriched: Teacher[] = list.map((teacher, i) => {
        const result = scheduleResults[i];
        const schedules = result.status === 'fulfilled' ? result.value.data : [];
        const isAvailableToday = schedules.some(
          s => s.dayOfWeek === todayDow && s.isAvailable
        );
        return { ...teacher, isAvailableToday };
      });

      setTeachers(enriched);
      setError(null);
    } catch {
      setError('Akademisyen listesi yüklenemedi.');
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    refresh().finally(() => setIsLoading(false));
  }, [refresh]);

  return { teachers, isLoading, error, refresh };
}
