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
    }
}
