namespace SmartCampus.Application.Features.Messages.Queries.GetConversation
{
    public class MessageDto
    {
        public int Id { get; set; }
        public int SenderId { get; set; }
        public int ReceiverId { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public bool IsRead { get; set; }
        public bool IsSystemMessage { get; set; }
        public int? RelatedAppointmentId { get; set; }

        /// <summary>
        /// Sistem mesajının bağlı olduğu randevunun GÜNCEL durumu.
        /// Yalnızca RelatedAppointmentId dolu olan mesajlarda gelir.
        /// </summary>
        public AppointmentInfoDto? RelatedAppointment { get; set; }
    }

    public class AppointmentInfoDto
    {
        public int Id { get; set; }
        public DateTime AppointmentDate { get; set; }
        /// <summary>0 = Pending, 1 = Approved, 2 = Rejected</summary>
        public int Status { get; set; }
        public string? Description { get; set; }
        public string TeacherName { get; set; } = string.Empty;
        public string StudentName { get; set; } = string.Empty;
        /// <summary>Randevu reddedildiyse hocanın girdiği sebep / önerilen saat.</summary>
        public string? RejectionReason { get; set; }
    }
}
