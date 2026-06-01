import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'favorite_menus';

export function useFavoriteMenus() {
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(val => {
      if (val) setFavorites(new Set(JSON.parse(val) as number[]));
    });
  }, []);

  const toggle = useCallback(async (menuId: number) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(menuId) ? next.delete(menuId) : next.add(menuId);
      AsyncStorage.setItem(KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const isFavorite = useCallback((menuId: number) => favorites.has(menuId), [favorites]);

  return { favorites, toggle, isFavorite };
}
