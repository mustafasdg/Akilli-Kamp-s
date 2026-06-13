namespace SmartCampus.Domain.Entities
{
    public class Appointment
    {
        public int ID { get; set; }

        public int StudentId { get; set; }
        public User? Student { get; set; }

        public int TeacherId { get; set; }
        public User? Teacher { get; set; }

        public DateTime AppointmentDate { get; set; }

        public AppointmentStatus Status { get; set; } = AppointmentStatus.Pending;

        public string Description { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Randevunun bağlı olduğu saat dilimi (opsiyonel)
        public int? ScheduleId { get; set; }
        public TeacherSchedule? Schedule { get; set; }

        // Randevu bir mesaj üzerinden tetiklendiyse bağlantı (opsiyonel)
        public int? MessageId { get; set; }
        public Message? Message { get; set; }

        // Red akışı: hocanın belirttiği sebep ve önerdiği yeni saat (opsiyonel)
        public string? RejectionReason { get; set; }
        public DateTime? SuggestedTime { get; set; }
    }
}
