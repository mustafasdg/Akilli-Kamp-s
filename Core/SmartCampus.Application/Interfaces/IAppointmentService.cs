using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Interfaces
{
    public interface IAppointmentService
    {
        /// <summary>Öğrencinin öğretmene randevu oluşturmasını sağlar.</summary>
        Task<Appointment> CreateAppointmentAsync(
            int studentId,
            int teacherId,
            int? scheduleId,
            DateTime appointmentDate,
            string description,
            CancellationToken ct = default);

        /// <summary>Öğretmenin belirtilen tarih-saatte müsait olup olmadığını kontrol eder.</summary>
        Task<bool> IsTeacherAvailableAsync(
            int teacherId,
            DateTime appointmentDate,
            CancellationToken ct = default);

        /// <summary>Öğrencinin kendi randevularını getirir.</summary>
        Task<IReadOnlyList<Appointment>> GetStudentAppointmentsAsync(
            int studentId,
            CancellationToken ct = default);

        /// <summary>Öğretmene gelen randevuları getirir.</summary>
        Task<IReadOnlyList<Appointment>> GetTeacherAppointmentsAsync(
            int teacherId,
            CancellationToken ct = default);

        /// <summary>Randevu durumunu günceller (Approved / Rejected).</summary>
        Task<Appointment?> UpdateStatusAsync(
            int appointmentId,
            AppointmentStatus newStatus,
            CancellationToken ct = default);
    }
}
