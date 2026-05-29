import { useState, useCallback, useEffect } from 'react';
import { Location } from '../types/models';
import { dataService } from '../services/dataService';

// Gerçek kampüs verileri — Google My Maps'ten alındı (WKT → enlem/boylam)
// WKT formatı: POINT (boylam enlem) — dönüştürüldü
const MOCK_LOCATIONS: Location[] = [
  {
    id: 1,
    bina_Adi: 'ISUBÜ Rektörlük',
    enlem: 37.7788716,
    boylam: 30.5467236,
    aciklama: 'Isparta Uygulamalı Bilimler Üniversitesi Rektörlük Binası',
  },
  {
    id: 2,
    bina_Adi: 'ISUBÜ 100. Yıl Binası',
    enlem: 37.7588462,
    boylam: 30.5478368,
    aciklama: 'Teknoloji Fakültesi — 100. Yıl Kampüsü',
  },
  {
    id: 3,
    bina_Adi: 'ISUBÜ Orman Fakültesi',
    enlem: 37.8321242,
    boylam: 30.5377543,
    aciklama: 'Isparta Uygulamalı Bilimler Üniversitesi Orman Fakültesi',
  },
  {
    id: 4,
    bina_Adi: 'ISUBÜ Ziraat Fakültesi',
    enlem: 37.8342812,
    boylam: 30.5385574,
    aciklama: 'Isparta Uygulamalı Bilimler Üniversitesi Ziraat Fakültesi',
  },
  {
    id: 5,
    bina_Adi: 'ISUBÜ Eğirdir Su Ürünleri Fak.',
    enlem: 37.8340148,
    boylam: 30.5377514,
    aciklama: 'Su Ürünleri Fakültesi',
  },
  {
    id: 6,
    bina_Adi: 'SDÜ Olimpik Yüzme Havuzu',
    enlem: 37.8322874,
    boylam: 30.532964,
    aciklama: 'SDÜ 29 Ekim Olimpik Yüzme Havuzu',
  },
  {
    id: 7,
    bina_Adi: 'SDÜ Starbucks (WPS)',
    enlem: 37.831469,
    boylam: 30.5264379,
    aciklama: 'SDÜ Kütüphane Starbucks Kafesi',
  },
  {
    id: 8,
    bina_Adi: 'SDÜ Bilgi Merkezi',
    enlem: 37.8286752,
    boylam: 30.5318182,
    aciklama: 'Süleyman Demirel Üniversitesi Kütüphane ve Bilgi Merkezi',
  },
  {
    id: 9,
    bina_Adi: 'Taş Cafe Restaurant',
    enlem: 37.8294618,
    boylam: 30.5288812,
    aciklama: 'Kampüs içi kafe ve restoran',
  },
  {
    id: 10,
    bina_Adi: 'ISUBÜ Isparta MYO',
    enlem: 37.828549,
    boylam: 30.5349511,
    aciklama: 'Isparta Uygulamalı Bilimler Üniversitesi Isparta Meslek Yüksekokulu',
  },
  {
    id: 11,
    bina_Adi: 'ISUBÜ Teknik Bilimler YO',
    enlem: 37.8321422,
    boylam: 30.5267975,
    aciklama: 'İsparta Uygulamalı Bilimler Üniversitesi Teknik Bilimler Yüksekokulu',
  },
  {
    id: 12,
    bina_Adi: 'SDÜ Yemekhanesi',
    enlem: 37.8260186,
    boylam: 30.5338802,
    aciklama: 'Süleyman Demirel Üniversitesi Ana Yemekhanesi',
  },
  {
    id: 13,
    bina_Adi: 'Ateş Döner',
    enlem: 37.7585782,
    boylam: 30.5474799,
    aciklama: '100. Yıl Kampüsü yakını — döner ve yemek',
  },
  {
    id: 14,
    bina_Adi: 'Base Büfe',
    enlem: 37.758767,
    boylam: 30.5474641,
    aciklama: '100. Yıl Kampüsü büfe',
  },
  {
    id: 15,
    bina_Adi: 'ISUBÜ Keçiborlu MYO',
    enlem: 37.9490346,
    boylam: 30.3040233,
    aciklama: 'Isparta Uygulamalı Bilimler Üniversitesi Keçiborlu Meslek Yüksekokulu',
  },
];

interface UseLocationsResult {
  locations: Location[];
  isLoading: boolean;
  error: string | null;
  isMock: boolean;
  refresh: () => Promise<void>;
}

export function useLocations(): UseLocationsResult {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await dataService.getLocations(1, 50);
      const items = res.data.items;
      if (items.length > 0) {
        setLocations(items);
        setIsMock(false);
      } else {
        // Backend boş → mock veri göster
        setLocations(MOCK_LOCATIONS);
        setIsMock(true);
      }
    } catch {
      // Erişilemez → mock veri göster
      setLocations(MOCK_LOCATIONS);
      setIsMock(true);
      setError('Backend bağlantısı kurulamadı — örnek veriler gösteriliyor.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { refresh(); }, []);

  return { locations, isLoading, error, isMock, refresh };
}
