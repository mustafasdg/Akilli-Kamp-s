namespace SmartCampus.Domain.Entities
{
    public class Notification
    {
        public int ID { get; set; }

        // Bildirimin sahibi (alici)
        public int UserId { get; set; }
        public User? User { get; set; }

        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;

        // Bildirimin kaynagi olan randevu (opsiyonel)
        public int? AppointmentId { get; set; }
        public Appointment? Appointment { get; set; }

        public bool IsRead { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
