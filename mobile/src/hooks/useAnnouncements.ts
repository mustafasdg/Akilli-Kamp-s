import { useState, useCallback, useEffect } from 'react';
import { Announcement } from '../types/models';
import { dataService } from '../services/dataService';

interface UseAnnouncementsResult {
  items: Announcement[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasNextPage: boolean;
  totalCount: number;
  error: string | null;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

const PAGE_SIZE = 10;

export function useAnnouncements(): UseAnnouncementsResult {
  const [items, setItems] = useState<Announcement[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (targetPage: number, append: boolean) => {
    try {
      const res = await dataService.getAnnouncements(targetPage, PAGE_SIZE);
      const data = res.data;
      setItems(prev => append ? [...prev, ...data.items] : data.items);
      setPage(targetPage);
      setHasNextPage(data.hasNextPage);
      setTotalCount(data.totalCount);
      setError(null);
    } catch {
      setError('Duyurular yüklenirken bir hata oluştu.');
    }
  }, []);

  // İlk yükleme — useEffect yerine lazy init ile çağrılır
  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetch(1, false);
    setIsLoading(false);
  }, [fetch]);

  const loadMore = useCallback(async () => {
    if (!hasNextPage || isLoadingMore) return;
    setIsLoadingMore(true);
    await fetch(page + 1, true);
    setIsLoadingMore(false);
  }, [fetch, hasNextPage, isLoadingMore, page]);

  // İlk mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { refresh(); }, []);

  return { items, isLoading, isLoadingMore, hasNextPage, totalCount, error, refresh, loadMore };
}
