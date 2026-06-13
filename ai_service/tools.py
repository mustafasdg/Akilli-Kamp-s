"""LangChain araçları (Tools): .NET backend'in AI uçlarıyla konuşur.

Her aracın docstring'i, LLM'in aracı NE ZAMAN ve NASIL çağıracağına karar vermek
için kullandığı tek kaynaktır; bu yüzden açıklamalar bilinçli olarak nettir.
"""
import requests
from langchain_core.tools import tool

from config import BACKEND_BASE_URL, REQUEST_TIMEOUT


@tool
def get_university_teachers() -> list[dict]:
    """Üniversitedeki tüm öğretim üyelerini (hocaları) listeler.

    Her kayıt şu alanları içerir: id, fullName, specialty, roomNumber.
    Bir hocayı ismiyle ararken ÖNCE bu aracı çağır ve ilgili 'id' değerini bul.
    Parametre almaz.
    """
    try:
        response = requests.get(
            f"{BACKEND_BASE_URL}/api/aitools/teachers",
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as exc:
        # Hata, LLM'in kullanıcıya açıklayabilmesi için yapılandırılmış şekilde döner.
        return {"error": f"Öğretim üyeleri alınamadı: {exc}"}


@tool
def get_teacher_schedule(teacher_id: int) -> list[dict]:
    """Belirli bir öğretim üyesinin haftalık programını getirir.

    Args:
        teacher_id: Hocanın sayısal kimliği (get_university_teachers'tan gelen 'id').

    Dönen her kayıt: dayOfWeek, startTime ("HH:mm"), endTime ("HH:mm"),
    isAvailable (true = randevuya müsait boş slot, false = ders veya dolu randevu).
    """
    try:
        response = requests.get(
            f"{BACKEND_BASE_URL}/api/aitools/schedules/{teacher_id}",
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as exc:
        return {"error": f"Program alınamadı (teacher_id={teacher_id}): {exc}"}


# Ajana bind edilecek araç listesi.
TOOLS = [get_university_teachers, get_teacher_schedule]
