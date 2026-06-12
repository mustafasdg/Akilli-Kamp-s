import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { TOKEN_KEY } from '../utils/constants';

// Android emülatörü host makinesiyle 10.0.2.2 üzerinden konuşur;
// iOS simülatörü ve web doğrudan localhost'u kullanır.
const BASE_URL = Platform.select({
  android: 'http://10.0.2.2:5206/api',
  default: 'http://localhost:5206/api',
});

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
