import { useState, useCallback, useEffect } from 'react';
import { Teacher, TeacherSchedule, TeacherLiveStatus } from '../types/models';
import { dataService } from '../services/dataService';

interface UseTeachersResult {
  teachers: Teacher[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const WORK_START_HOUR = 9;
const WORK_END_HOUR   = 17;

// Akademisyenin ŞU ANKİ saat dilimine göre durumunu hesaplar.
function computeCurrentStatus(
  schedules: TeacherSchedule[],
  dow: number,
  hour: number,
): TeacherLiveStatus {
  const isWeekend = dow === 0 || dow === 6;

  // Hafta sonu veya mesai (09:00–17:00) dışında → müsait değil
  if (isWeekend || hour < WORK_START_HOUR || hour >= WORK_END_HOUR) {
    return { label: 'Müsait Değil', available: false };
  }

  // Şu anki saate denk gelen slot
  const slot = schedules.find(s =>
    s.dayOfWeek === dow &&
    parseInt(s.startTime.split(':')[0], 10) <= hour &&
    parseInt(s.endTime.split(':')[0], 10) > hour,
  );

  if (!slot) return { label: 'Şu an Müsait', available: true };               // boş saat → müsait
  if (slot.type === 'Ders' || slot.type === 'EkDers')
    return { label: 'Şu an Derste', available: false };                       // ders/ek ders
  if (!slot.isAvailable) return { label: 'Müsait Değil', available: false };  // onaylı randevuyla dolu
  return { label: 'Şu an Müsait', available: true };
}

export function useTeachers(): UseTeachersResult {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const teachersRes = await dataService.getTeachers();
      const list = teachersRes.data;

      const now  = new Date();
      const dow  = now.getDay();   // 0 Pazar … 6 Cumartesi
      const hour = now.getHours();

      // Tüm hocaların programlarını paralel olarak çek
      const scheduleResults = await Promise.allSettled(
        list.map(t => dataService.getTeacherSchedules(t.id)),
      );

      const enriched: Teacher[] = list.map((teacher, i) => {
        const result = scheduleResults[i];
        const schedules = result.status === 'fulfilled' ? result.value.data : [];
        return { ...teacher, currentStatus: computeCurrentStatus(schedules, dow, hour) };
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
