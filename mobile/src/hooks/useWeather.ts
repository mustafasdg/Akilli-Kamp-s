import { useState, useEffect } from 'react';

interface WeatherData {
  temperature: number;
  windspeed: number;
  weathercode: number;
}

interface UseWeatherResult {
  weather: WeatherData | null;
  isLoading: boolean;
  error: boolean;
}

// WMO weather code → Türkçe açıklama + emoji
export function getWeatherDescription(code: number): { label: string; emoji: string } {
  if (code === 0)                    return { label: 'Açık', emoji: '☀️' };
  if (code <= 2)                     return { label: 'Az Bulutlu', emoji: '🌤️' };
  if (code === 3)                    return { label: 'Bulutlu', emoji: '☁️' };
  if (code <= 48)                    return { label: 'Sisli', emoji: '🌫️' };
  if (code <= 55)                    return { label: 'Çiseleme', emoji: '🌦️' };
  if (code <= 65)                    return { label: 'Yağmurlu', emoji: '🌧️' };
  if (code <= 75)                    return { label: 'Karlı', emoji: '❄️' };
  if (code <= 82)                    return { label: 'Sağanak', emoji: '🌩️' };
  if (code >= 95)                    return { label: 'Fırtına', emoji: '⛈️' };
  return { label: 'Değişken', emoji: '🌈' };
}

/**
 * Open-Meteo — ücretsiz, API key gerektirmez.
 * lat/lon: varsayılan Ankara. Üniversitenin koordinatını yazabilirsin.
 */
export function useWeather(lat = 39.9255, lon = 32.8663): UseWeatherResult {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lon}` +
      `&current_weather=true`;

    fetch(url)
      .then(r => r.json())
      .then(data => {
        setWeather(data.current_weather as WeatherData);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  }, [lat, lon]);

  return { weather, isLoading, error };
}
