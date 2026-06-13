namespace SmartCampus.Domain.Entities
{
    public class Message
    {
        public int ID { get; set; }

        public int SenderId { get; set; }
        public User? Sender { get; set; }

        public int ReceiverId { get; set; }
        public User? Receiver { get; set; }

        public string Content { get; set; } = string.Empty;

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        public bool IsRead { get; set; } = false;

        /// <summary>Sistem tarafından üretilen mesaj (ör. randevu kartı) ise true.</summary>
        public bool IsSystemMessage { get; set; } = false;

        /// <summary>Sistem mesajının ilişkili olduğu randevu (opsiyonel).</summary>
        public int? RelatedAppointmentId { get; set; }
        public Appointment? RelatedAppointment { get; set; }
    }
}
