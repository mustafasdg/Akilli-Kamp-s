r"""LangGraph ajanı: ChatGroq + araçlar ile bir ReAct (düşün-araç-çağır) döngüsü kurar.

Akış:
    START -> chatbot -> (araç çağrısı var mı?) --evet--> tools -> chatbot -> ...
                                              \--hayır-> END
"""
import os
from datetime import datetime

from langchain_core.messages import SystemMessage
from langchain_groq import ChatGroq
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import START, MessagesState, StateGraph
from langgraph.prebuilt import ToolNode, tools_condition

from tools import TOOLS


class AgentState(MessagesState):
    """Sohbet mesajları + oturumdan türetilen öğrenci kimliği.

    student_id, /chat ucunda session_id'den (user-{id}-...) parse edilip state'e
    konur; create_appointment aracı bunu InjectedState ile okur (LLM görmez/üretmez).
    """
    student_id: int | None


_WEEKDAYS_TR = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"]


def _build_system_prompt() -> SystemMessage:
    """Her çağrıda güncel tarih/saati içeren sistem mesajını üretir.

    Sabit bir modül düzeyi sabiti yerine fonksiyon kullanılmasının nedeni:
    LangGraph'ta chatbot düğümü her istek için çağrılır; böylece model
    her yanıtta gerçek güncel zamanı görür ve 'yarın', 'haftaya' gibi
    göreli tarihleri doğru hesaplayabilir.
    """
    now = datetime.now()
    weekday = _WEEKDAYS_TR[now.weekday()]
    date_str = now.strftime(f"%d.%m.%Y {weekday} %H:%M")

    return SystemMessage(
        content=(
            f"Bugünün tarihi ve saati: {date_str}.\n"
            "Sen ISUBÜ Akıllı Kampüs uygulamasının Türkçe konuşan yapay zeka asistanısın. "
            "Öğrencilere öğretim üyeleri, haftalık programlar ve randevu oluşturma "
            "konusunda yardımcı olursun.\n"
            "- Bir hocanın programını öğrenmek için ÖNCE `get_university_teachers` ile "
            "hocanın 'id' değerini bul, SONRA `get_teacher_schedule` ile programını getir.\n"
            "- teacher_id'yi MUTLAKA get_university_teachers sonucundaki gerçek 'id'den al; "
            "ASLA kendin bir sayı uydurma.\n"
            "- Randevu oluşturmak için `create_appointment` aracını kullan. ÖNCE "
            "`get_teacher_schedule` ile istenen saatin isAvailable=true (boş) olduğunu "
            "doğrula, SONRA randevuyu oluştur. Araca teacher_id, date (YYYY-MM-DD), "
            "start_time ve end_time (HH:mm) ver; öğrenci kimliğini SORMA, otomatik gelir.\n"
            "- Randevu talebi gönderildikten sonra kullanıcıya ASLA 'Randevunuz oluşturuldu' "
            "veya 'Randevunuz onaylandı' deme. Bunun yerine şunu söyle: "
            "'Randevu talebiniz hocaya iletildi, hocanın onayı bekleniyor.'\n"
            "- Tarih/saat belirsizse randevu oluşturmadan önce kullanıcıdan netleştir.\n"
            "- 'Yarın', 'haftaya Salı', 'öbür gün' gibi göreli tarihleri yukarıdaki "
            "güncel tarih/saati referans alarak mutlak tarihe (YYYY-MM-DD) çevir.\n"
            "- Günleri ve saatleri kullanıcıya sade, anlaşılır biçimde sun.\n"
            "- isAvailable=true olan slotlar randevuya müsaittir; false olanlar ders/doludur.\n"
            "- Yemekhane menüsü, bugünkü yemekler veya kalori hakkında soru gelirse "
            "`get_today_menu` aracını çağır; sonucu sade ve anlaşılır biçimde sun.\n"
            "- Bilgi uydurma; her zaman araçlardan gelen gerçek veriyi kullan."
        )
    )


def build_agent(llm=None):
    """Derlenmiş LangGraph ajanını döndürür (uygulama açılışında bir kez çağrılır).

    Args:
        llm: Test/özelleştirme için enjekte edilebilen sohbet modeli. None ise
            varsayılan ChatGroq (llama-3.3-70b-versatile) kullanılır.
    """
    llm = llm or ChatGroq(
        model="llama-3.3-70b-versatile",
        groq_api_key=os.getenv("GROQ_API_KEY"),
    )
    llm_with_tools = llm.bind_tools(TOOLS)

    def chatbot(state: AgentState) -> dict:
        """LLM düğümü: güncel tarih/saat içeren sistem komutu + sohbet geçmişiyle modeli çağırır."""
        response = llm_with_tools.invoke([_build_system_prompt(), *state["messages"]])
        return {"messages": [response]}

    graph = StateGraph(AgentState)
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
