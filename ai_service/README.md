# ISUBÜ Akıllı Kampüs — AI Servisi

LangGraph tabanlı yapay zeka mikroservisi. FastAPI üzerinden `/chat` ucu sunar;
LLM (ChatGroq / llama-3.3-70b-versatile), .NET backend'in AI uçlarını **Tool / Function Calling**
ile çağırarak öğretim üyeleri ve haftalık programları hakkında soruları yanıtlar.

## Mimari

```
Kullanıcı mesajı
      │
      ▼
FastAPI  /chat  (main.py)
      │
      ▼
LangGraph ajanı  (agent.py)        ┌─────────────────────────────┐
   START → chatbot ⇄ tools  ──────▶│ .NET backend  (port 5206)   │
                  │                 │  /api/aitools/teachers      │
                  ▼                 │  /api/aitools/schedules/{id}│
                 END                └─────────────────────────────┘
```

| Dosya | Görev |
|-------|-------|
| `main.py`     | FastAPI uygulaması ve `/chat` ucu |
| `agent.py`    | LangGraph `StateGraph` + ChatGroq + `bind_tools` |
| `tools.py`    | `@tool` ile .NET backend'i çağıran iki araç |
| `config.py`   | `.env` yükleme ve ayarlar |

## Kurulum

```bash
cd ai_service

# 1) Sanal ortam
python -m venv .venv
.venv\Scripts\activate        # Windows (PowerShell/CMD)
# source .venv/bin/activate   # macOS / Linux

# 2) Bağımlılıklar
pip install -r requirements.txt

# 3) Ortam değişkenleri
copy .env.example .env        # Windows  (cp .env.example .env  -> Unix)
#   .env içindeki GROQ_API_KEY değerini kendi anahtarınızla doldurun
```

## Çalıştırma

Önce **.NET backend'in `http://localhost:5206` üzerinde çalıştığından** ve
`AiToolsController` uçlarının erişilebilir olduğundan emin olun, sonra:

```bash
# --host 0.0.0.0 ŞART: telefon/emülatör servise LAN IP'sinden ulaşır.
# (Yalnızca `--port 8000` verirsen uvicorn 127.0.0.1'e bağlanır ve mobil cihaz erişemez.)
uvicorn main:app --host 0.0.0.0 --reload --port 8000
#   veya:  python main.py   (zaten 0.0.0.0'a bağlanır)
```

API dokümanı: <http://localhost:8000/docs>

> **Mobil/cihazdan erişim:** Mobil uygulama servise bilgisayarın LAN IP'sinden ulaşır
> (`mobile/src/services/apiClient.ts` → `API_HOST`; AI istemcisi `aiClient.ts` aynı host'u 8000 portuyla kullanır).
> IP değişirse (ağ/modem değişimi) `API_HOST`'u güncelle. Windows Güvenlik Duvarı 8000'i
> engelliyorsa (yönetici): `netsh advfirewall firewall add rule name="AI 8000" dir=in action=allow protocol=TCP localport=8000`

## Asistana Neler Sorabilirsiniz?

Tüm istekler doğal dille yapılır; ajan hangi aracı kullanacağına arka planda kendi karar verir.

### 1. Hoca & Uzmanlık Sorgulama (okuma)
- "Üniversitede yapay zeka alanında uzmanlaşmış hangi hocalar var?"
- "Bölümdeki hocaların isimlerini ve oda numaralarını yazar mısın?"

→ Ajan `get_university_teachers` aracıyla .NET API'den güncel listeyi çeker.

### 2. Müsaitlik & Program Sorgulama (okuma)
- "Dr. Ayşe Yılmaz yarın saat 14:00'te müsait mi?"
- "Ahmet Hoca'nın cuma günkü ders programı nasıl, ne zaman boşluğu var?"

→ Ajan önce hocanın ID'sini bulur, sonra `get_teacher_schedule` ile dolu/boş saatleri analiz edip net bir cevap verir.

### 3. Otonom Randevu Oluşturma (yazma / aksiyon)
- "Ahmet Hoca müsaitse bana yarın saat 15:00 için bir randevu oluşturur musun?"
- "Lütfen Ayşe Hoca'nın perşembe günkü ilk boş saatine benim adıma randevu al."

→ Ajan, oturumdaki kullanıcı kimliğini (`session_id` → `InjectedState`) güvenle alır,
`create_appointment` ile .NET'e istek atar ve randevuyu doğrudan veritabanına kaydeder.

## Test

```bash
# Sağlık kontrolü
curl http://localhost:8000/health

# Sohbet — body: message + session_id (her kullanıcı/oturum için ayrı kimlik)
curl -X POST http://localhost:8000/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\": \"Hangi hocalar var?\", \"session_id\": \"user-42\"}"

# Aynı session_id ile devam edince ajan önceki konuşmayı hatırlar (LangGraph MemorySaver)
curl -X POST http://localhost:8000/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\": \"Cevriye hocanin bu haftaki musait saatleri neler?\", \"session_id\": \"user-42\"}"
```

İstek gövdesi: `{ "message": "...", "session_id": "..." }`

Örnek yanıt (nihai cevap + debug bilgisi):

```json
{
  "reply": "Cevriye Altıntaş hocanın bu hafta müsait saatleri: Pazartesi 09:00-10:00, ...",
  "debug_info": {
    "tools_called": ["get_university_teachers", "get_teacher_schedule"]
  }
}
```

> Hata durumunda (ör. Groq limiti dolu) uç, 500 yerine temiz bir `502` döner:
> `{ "detail": "Ajan hatası: ..." }`

## Ortam değişkenleri

| Değişken | Varsayılan | Açıklama |
|----------|------------|----------|
| `GROQ_API_KEY`     | —                       | Groq API anahtarı (zorunlu) |
| `BACKEND_BASE_URL` | `http://localhost:5206` | .NET backend taban adresi |
| `BACKEND_TIMEOUT`  | `10`                    | Backend istek zaman aşımı (sn) |
