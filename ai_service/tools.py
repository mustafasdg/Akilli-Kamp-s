"""LangChain araçları (Tools): .NET backend'in AI uçlarıyla konuşur.

Her aracın docstring'i, LLM'in aracı NE ZAMAN ve NASIL çağıracağına karar vermek
için kullandığı tek kaynaktır; bu yüzden açıklamalar bilinçli olarak nettir.
"""
import json
from typing import Annotated, Optional

import requests
from langchain_core.tools import tool
from langgraph.prebuilt import InjectedState

from config import BACKEND_BASE_URL, REQUEST_TIMEOUT


@tool
def get_university_teachers() -> str:
    """Üniversitedeki tüm öğretim üyelerini (hocaları) listeler.

    Her kayıt şu alanları içerir: id, fullName, specialty, roomNumber.
    Bir hocayı ismiyle ararken ÖNCE bu aracı çağır ve ilgili 'id' değerini bul.
    Parametre almaz. JSON dizesi döner.
    """
    try:
        response = requests.get(
            f"{BACKEND_BASE_URL}/api/aitools/teachers",
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
        # Groq, tool mesaj içeriğinin DÜZ STRING olmasını şart koşar → JSON'a serileştir.
        return json.dumps(response.json(), ensure_ascii=False)
    except requests.RequestException as exc:
        return f"Öğretim üyeleri alınamadı: {exc}"


@tool
def get_teacher_schedule(teacher_id: int) -> list[dict]:
    """Belirli bir öğretim üyesinin haftalık programını getirir.

    Args:
        teacher_id: Hocanın sayısal kimliği (get_university_teachers'tan gelen 'id').

    Dönen her kayıt: dayOfWeek, startTime ("HH:mm"), endTime ("HH:mm"),
    isAvailable (true = randevuya müsait boş slot, false = ders veya dolu randevu).
    JSON dizesi döner.
    """
    try:
        response = requests.get(
            f"{BACKEND_BASE_URL}/api/aitools/schedules/{teacher_id}",
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
        # Groq, tool mesaj içeriğinin DÜZ STRING olmasını şart koşar → JSON'a serileştir.
        return json.dumps(response.json(), ensure_ascii=False)
    except requests.RequestException as exc:
        return f"Program alınamadı (teacher_id={teacher_id}): {exc}"


@tool
def create_appointment(
    teacher_id: int,
    date: str,
    start_time: str,
    end_time: str,
    student_id: Annotated[Optional[int], InjectedState("student_id")] = None,
) -> str:
    """Öğrenci adına bir öğretim üyesine randevu TALEBİ gönderir.

    Bu işlem randevuyu kesinleştirmez; yalnızca hocanın onayına sunar.
    Hoca talebi kabul edene kadar randevu "Beklemede" (Pending) durumunda kalır.

    Args:
        teacher_id: Randevu talep edilecek hocanın ID'si (get_university_teachers'tan).
        date: Randevu günü, "YYYY-MM-DD" (örn. "2026-06-15").
        start_time: Başlangıç saati "HH:mm" (örn. "09:00").
        end_time: Bitiş saati "HH:mm" (örn. "10:00").

    NOT: student_id'yi SEN verme; oturumdan otomatik gelir. Talebi göndermeden önce
    uygun boş slotu get_teacher_schedule ile (isAvailable=true) doğrula.
    Başarılıysa talebin iletildiğine dair mesaj döner; aksi halde (saat dolu/çakışma/
    mesai dışı vb.) .NET backend'den dönen hata mesajı döner.
    """
    if not student_id:
        return (
            "Randevu oluşturulamadı: öğrenci kimliği belirlenemedi "
            "(kullanıcının giriş yapmış olması gerekir)."
        )

    payload = {
        "teacherId": teacher_id,
        "studentId": student_id,
        "date": date,
        "startTime": start_time,
        "endTime": end_time,
    }
    try:
        response = requests.post(
            f"{BACKEND_BASE_URL}/api/aitools/appointments",
            json=payload,
            timeout=REQUEST_TIMEOUT,
        )
        if response.ok:
            return "Randevu başarıyla oluşturuldu."
        # .NET'ten dönen iş kuralı hatasını ({ "message": ... }) LLM'e ilet.
        try:
            data = response.json()
            detail = data.get("message") or data.get("detail") or response.text
        except ValueError:
            detail = response.text
        return f"Randevu oluşturulamadı: {detail}"
    except requests.RequestException as exc:
        return f"Randevu oluşturulamadı (bağlantı hatası): {exc}"


@tool
def get_today_menu() -> str:
    """Günün yemekhane menüsünü, yemekleri ve toplam kaloriyi getirir.

    Öğle yemeğine çıkan tüm kalemleri döner; her kalem için isim, kategori
    (Çorba / Ana Yemek / Ara Sıcak / Tatlı) ve kalori (kcal) bilgisi gelir.
    Yanıt aynı zamanda günün toplam kalori değerini de içerir.

    Kullanıcı "bugün ne yemek var", "yemekhanede ne çıkıyor", "menü nedir",
    "kaç kalori" veya yemekhane ile ilgili başka bir şey sorduğunda bu aracı çağır.
    Parametre almaz. JSON dizesi döner.
    """
    try:
        response = requests.get(
            f"{BACKEND_BASE_URL}/api/menus/today",
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
        return json.dumps(response.json(), ensure_ascii=False)
    except requests.RequestException as exc:
        return f"Yemekhane menüsü alınamadı: {exc}"


# Ajana bind edilecek araç listesi.
TOOLS = [get_university_teachers, get_teacher_schedule, create_appointment, get_today_menu]
