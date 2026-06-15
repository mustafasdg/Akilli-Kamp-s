using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace SmartCampus.Domain.Entities
{
    public class TeacherSchedule
    {
        public int ID { get; set; }

        public int TeacherId { get; set; }
        public User? Teacher { get; set; }

        public DayOfWeek DayOfWeek { get; set; }

        // SQL Server'da 'time' kolonuna eslesir
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }

        public bool IsAvailable { get; set; } = true;

        // Katmanlı ders tipi: Müsait | Ders | EkDers
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public ScheduleType Type { get; set; } = ScheduleType.Müsait;

        // Ders/EkDers için opsiyonel bilgiler
        public string? CourseName    { get; set; }
        public string? ClassLocation { get; set; }

        // Slotun üzerindeki randevu taleplerine göre hesaplanan anlık durum
        // (Available | Booked | Pending). Veritabanına yazılmaz; sorgu anında
        // Appointment tablosundan türetilip istemciye string olarak döner.
        [NotMapped]
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public SlotStatus Status { get; set; } = SlotStatus.Available;
    }
}
