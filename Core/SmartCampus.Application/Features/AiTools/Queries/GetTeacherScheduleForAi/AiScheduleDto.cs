namespace SmartCampus.Application.Features.AiTools.Queries.GetTeacherScheduleForAi
{
    /// <summary>
    /// LLM ajanı için tek bir 1-saatlik program bloğunun sade görünümü.
    /// <see cref="IsAvailable"/>, hem ders (Ders/EkDers) hem de aktif randevu çakışması
    /// kontrol edildikten sonra hesaplanan nihai dolu/boş durumudur.
    /// </summary>
    public class AiScheduleDto
    {
        /// <summary>Haftanın günü (örn. "Monday").</summary>
        public string DayOfWeek { get; set; } = string.Empty;

        /// <summary>Başlangıç saati "HH:mm" formatında (örn. "09:00").</summary>
        public string StartTime { get; set; } = string.Empty;

        /// <summary>Bitiş saati "HH:mm" formatında (örn. "10:00").</summary>
        public string EndTime { get; set; } = string.Empty;

        /// <summary>
        /// true  = öğrenci randevusu alınabilecek boş slot;
        /// false = ders/ek ders veya dolu (bekleyen/onaylı randevu mevcut).
        /// </summary>
        public bool IsAvailable { get; set; }
    }
}
