"""FastAPI uygulaması: /chat ucu, gelen mesajı LangGraph ajanından geçirip cevabı döner."""
import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.messages import HumanMessage, ToolMessage
from pydantic import BaseModel

# config içe aktarımı .env'i yükler -> diğer modüllerden önce ortam değişkenleri hazır olur.
from config import GROQ_API_KEY
from agent import build_agent

logger = logging.getLogger("uvicorn.error")

app = FastAPI(title="ISUBÜ Akıllı Kampüs AI Servisi", version="1.0.0")

# Mobil uygulamadan (Expo) gelen isteklere izin ver. Servis kimlik bilgisi (cookie)
# kullanmadığından "*" origin + credentials=False güvenli ve geçerlidir.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

if not GROQ_API_KEY:
    logger.warning(
        "GROQ_API_KEY tanımlı değil. /chat çağrıları başarısız olur; "
        "anahtarınızı .env dosyasına ekleyin (bkz. .env.example)."
    )

# Ajan, uygulama açılışında BİR KEZ derlenir (her istekte yeniden kurulmaz).
agent = build_agent()


class ChatRequest(BaseModel):
    """İstek gövdesi: kullanıcı mesajı + oturum kimliği."""

    message: str
    session_id: str


class DebugInfo(BaseModel):
    """Ajanın o istekte yaptığı arka plan işlemleri (hata ayıklama için)."""

    tools_called: list[str]


class ChatResponse(BaseModel):
    """Yanıt gövdesi: nihai cevap + debug bilgisi."""

    reply: str
    debug_info: DebugInfo


def _parse_student_id(session_id: str) -> int | None:
    """session_id 'user-{id}-{timestamp}' biçimindeyse öğrenci {id}'sini döndürür."""
    parts = session_id.split("-")
    if len(parts) >= 2 and parts[0] == "user":
        try:
            return int(parts[1])
        except ValueError:
            return None
    return None


@app.get("/health")
def health() -> dict:
    """Basit sağlık kontrolü."""
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    """Mesajı, session_id'ye bağlı kalıcı hafızayla ajandan geçirir.

    Aynı session_id ile gelen ardışık istekler aynı sohbet geçmişini paylaşır;
    farklı session_id'ler birbirinden tamamen izole oturumlardır.
    """
    # thread_id = session_id -> checkpointer her oturumu ayrı bir geçmişte tutar.
    config = {"configurable": {"thread_id": request.session_id}}

    # session_id (user-{id}-{ts}) -> öğrenci kimliği; create_appointment aracı bunu
    # InjectedState ile state'ten okur (LLM bu değeri görmez/üretmez).
    student_id = _parse_student_id(request.session_id)

    # Bu isteğe ait YENİ mesajları ayırt edebilmek için önceki mesaj sayısını al.
    prev_state = agent.get_state(config)
    prev_count = len((prev_state.values or {}).get("messages", []))

    try:
        result = agent.invoke(
            {
                "messages": [HumanMessage(content=request.message)],
                "student_id": student_id,
            },
            config=config,
        )
    except Exception as exc:
        # LLM / ağ / araç hatalarını 500 stacktrace yerine temiz JSON'a çevir.
        logger.exception("Ajan çalıştırılırken hata oluştu")
        raise HTTPException(status_code=502, detail=f"Ajan hatası: {exc}") from exc

    messages = result["messages"]
    new_messages = messages[prev_count:]

    # Yalnızca bu istekte çalıştırılan araç adları (çağrı sırasıyla, ToolMessage'lardan).
    tools_called = [m.name for m in new_messages if isinstance(m, ToolMessage)]

    return ChatResponse(
        reply=messages[-1].content,
        debug_info=DebugInfo(tools_called=tools_called),
    )


if __name__ == "__main__":
    # Geliştirme için doğrudan çalıştırma: `python main.py`
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
