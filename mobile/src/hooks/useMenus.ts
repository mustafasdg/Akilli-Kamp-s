import { useState, useCallback, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { Menu, PagedResult } from '../types/models';

interface UseMenusResult {
  items: Menu[];
  loading: boolean;
  isLoadingMore: boolean;
  hasNextPage: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

const PAGE_SIZE = 10;

export function useMenus(): UseMenusResult {
  const [items, setItems] = useState<Menu[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async (targetPage: number, append: boolean) => {
    try {
      const res = await apiClient.get<PagedResult<Menu>>('/menus', {
        params: { page: targetPage, pageSize: PAGE_SIZE },
      });
      const data = res.data;
      setItems(prev => (append ? [...prev, ...data.items] : data.items));
      setPage(targetPage);
      setHasNextPage(data.hasNextPage);
      setError(null);
    } catch {
      setError('Menüler yüklenirken bir hata oluştu.');
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchPage(1, false);
    setLoading(false);
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (!hasNextPage || isLoadingMore) return;
    setIsLoadingMore(true);
    await fetchPage(page + 1, true);
    setIsLoadingMore(false);
  }, [fetchPage, hasNextPage, isLoadingMore, page]);

  useEffect(() => { refresh(); }, [refresh]);

  return { items, loading, isLoadingMore, hasNextPage, error, refresh, loadMore };
}
