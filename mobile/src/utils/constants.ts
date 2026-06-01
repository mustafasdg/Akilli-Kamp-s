export const TOKEN_KEY = 'auth_token';

/**
 * Makinenin LAN IP'ini bul: Windows → cmd → ipconfig → "IPv4 Adresi"
 * Gerçek port: 5206  (launchSettings.json → applicationUrl)
 * Fiziksel cihaz + bilgisayar aynı Wi-Fi'da olmalı.
 */
export const API_BASE_URL = 'http://192.168.137.1:5206/api';
