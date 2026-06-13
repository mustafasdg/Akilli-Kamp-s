r"""LangGraph ajanı: ChatOpenAI + araçlar ile bir ReAct (düşün-araç-çağır) döngüsü kurar.

Akış:
    START -> chatbot -> (araç çağrısı var mı?) --evet--> tools -> chatbot -> ...
                                              \--hayır-> END
"""
from langchain_core.messages import SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import START, MessagesState, StateGraph
from langgraph.prebuilt import ToolNode, tools_condition

from config import OPENAI_MODEL
from tools import TOOLS

# Ajanın davranışını yönlendiren sistem komutu.
SYSTEM_PROMPT = SystemMessage(
    content=(
        "Sen ISUBÜ Akıllı Kampüs uygulamasının Türkçe konuşan yapay zeka asistanısın. "
        "Öğrencilere öğretim üyeleri ve onların haftalık müsaitlik/ders programları "
        "konusunda yardımcı olursun.\n"
        "- Bir hocanın programını öğrenmek için ÖNCE `get_university_teachers` ile "
        "hocanın 'id' değerini bul, SONRA `get_teacher_schedule` ile programını getir.\n"
        "- Günleri ve saatleri kullanıcıya sade, anlaşılır biçimde sun.\n"
        "- isAvailable=true olan slotlar randevuya müsaittir; false olanlar ders/doludur.\n"
        "- Bilgi uydurma; her zaman araçlardan gelen gerçek veriyi kullan."
    )
)


def build_agent(llm=None):
    """Derlenmiş LangGraph ajanını döndürür (uygulama açılışında bir kez çağrılır).

    Args:
        llm: Test/özelleştirme için enjekte edilebilen sohbet modeli. None ise
            varsayılan ChatOpenAI (gpt-4o-mini) kullanılır.
    """
    llm = llm or ChatOpenAI(model=OPENAI_MODEL, temperature=0)
    llm_with_tools = llm.bind_tools(TOOLS)

    def chatbot(state: MessagesState) -> dict:
        """LLM düğümü: sistem komutu + sohbet geçmişiyle modeli çağırır."""
        response = llm_with_tools.invoke([SYSTEM_PROMPT, *state["messages"]])
        return {"messages": [response]}

    graph = StateGraph(MessagesState)
    graph.add_node("chatbot", chatbot)
    graph.add_node("tools", ToolNode(TOOLS))

    graph.add_edge(START, "chatbot")
    # LLM araç çağırdıysa "tools" düğümüne; çağırmadıysa (nihai cevap) END'e gider.
    graph.add_conditional_edges("chatbot", tools_condition)
    # Araç çalıştıktan sonra sonucu yorumlaması için tekrar LLM'e dön.
    graph.add_edge("tools", "chatbot")

    # MemorySaver (in-memory checkpointer): her thread_id (session_id) için sohbet
    # geçmişini süreç belleğinde saklar; aynı oturum ardışık isteklerde bağlamı korur.
    # Kalıcı saklama gerekiyorsa SqliteSaver / PostgresSaver ile değiştirilebilir.
    return graph.compile(checkpointer=MemorySaver())
