import axios from 'axios';
import { API_HOST } from './apiClient';

// Python LangGraph AI servisi: .NET ile AYNI host, 8000 portu.
// JWT göndermeyiz — servis [AllowAnonymous] ve kimlik doğrulaması beklemez.
const AI_BASE_URL = `http://${API_HOST}:8000`;

const aiClient = axios.create({
  baseURL: AI_BASE_URL,
  // Ajan tur döngüsü (LLM düşünme + araç çağrıları) birkaç saniye sürebilir.
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

export default aiClient;
