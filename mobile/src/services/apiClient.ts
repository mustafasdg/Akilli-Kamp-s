import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY } from '../utils/constants';

// Fiziksel cihaz testi: bilgisayarın LAN IP'si.
// Emülatöre dönünce → 'http://10.0.2.2:5206/api' (Android) veya 'http://localhost:5206/api' (iOS).
// AI servisi (aiClient.ts) aynı host'u 8000 portuyla kullanır → tek kaynak.
export const API_HOST = '172.20.10.3';
const BASE_URL = `http://${API_HOST}:5206/api`;

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
