# ISUBÜ Akıllı Kampüs — AI Servisi

LangGraph tabanlı yapay zeka mikroservisi. FastAPI üzerinden `/chat` ucu sunar;
LLM (ChatOpenAI / gpt-4o-mini), .NET backend'in AI uçlarını **Tool / Function Calling**
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
| `agent.py`    | LangGraph `StateGraph` + ChatOpenAI + `bind_tools` |
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
#   .env içindeki OPENAI_API_KEY değerini kendi anahtarınızla doldurun
```

## Çalıştırma

Önce **.NET backend'in `http://localhost:5206` üzerinde çalıştığından** ve
`AiToolsController` uçlarının erişilebilir olduğundan emin olun, sonra:

```bash
uvicorn main:app --reload --port 8000
#   veya:  python main.py
```

API dokümanı: <http://localhost:8000/docs>

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

> Hata durumunda (ör. OpenAI kotası dolu) uç, 500 yerine temiz bir `502` döner:
> `{ "detail": "Ajan hatası: ..." }`

## Ortam değişkenleri

| Değişken | Varsayılan | Açıklama |
|----------|------------|----------|
| `OPENAI_API_KEY`   | —                       | OpenAI API anahtarı (zorunlu) |
| `OPENAI_MODEL`     | `gpt-4o-mini`           | Kullanılacak model |
| `BACKEND_BASE_URL` | `http://localhost:5206` | .NET backend taban adresi |
| `BACKEND_TIMEOUT`  | `10`                    | Backend istek zaman aşımı (sn) |
