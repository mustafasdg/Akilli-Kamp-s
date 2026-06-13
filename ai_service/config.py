"""Ortak yapılandırma.

Bu modül içe aktarıldığı anda `.env` dosyasını yükler; böylece diğer modüller
(`os.getenv` çağırmadan önce) ortam değişkenlerinin hazır olduğundan emin olur.
Tüm ayarlar tek noktadan okunur.
"""
import os

from dotenv import load_dotenv

# .env dosyası içe aktarımda bir kez yüklenir.
load_dotenv()

# --- OpenAI ---
OPENAI_API_KEY: str | None = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# --- .NET backend (AiToolsController) ---
# Sondaki '/' temizlenir ki URL birleştirmede çift slash oluşmasın.
BACKEND_BASE_URL: str = os.getenv("BACKEND_BASE_URL", "http://localhost:5206").rstrip("/")

# Backend HTTP isteklerinde saniye cinsinden zaman aşımı.
REQUEST_TIMEOUT: float = float(os.getenv("BACKEND_TIMEOUT", "10"))
