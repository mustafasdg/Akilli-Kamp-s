using SmartCampus.Application.Interfaces;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Services
{
    public class AppointmentService : IAppointmentService
    {
        private readonly IUnitOfWork _uow;

        public AppointmentService(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<Appointment> CreateAppointmentAsync(
            int studentId,
            int teacherId,
            int? scheduleId,
            DateTime appointmentDate,
            string description,
            CancellationToken ct = default)
        {
            var available = await IsTeacherAvailableAsync(teacherId, appointmentDate, ct);
            if (!available)
                throw new InvalidOperationException("Öğretmen seçilen tarih ve saatte müsait değil.");

            var appointment = new Appointment
            {
                StudentId = studentId,
                TeacherId = teacherId,
                ScheduleId = scheduleId,
                AppointmentDate = appointmentDate,
                Description = description.Trim(),
                Status = AppointmentStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _uow.Appointments.AddAsync(appointment, ct);
            await _uow.SaveChangesAsync(ct);
            return appointment;
        }

        public async Task<bool> IsTeacherAvailableAsync(
            int teacherId,
            DateTime appointmentDate,
            CancellationToken ct = default)
        {
            var appointmentTime = TimeOnly.FromDateTime(appointmentDate);

            // 1. Öğretmenin o saate denk gelen aktif 1-saatlik slotu var mı?
            var hasSchedule = await _uow.TeacherSchedules.AnyAsync(
                s => s.TeacherId == teacherId &&
                     s.DayOfWeek == appointmentDate.DayOfWeek &&
                     s.StartTime <= appointmentTime &&
                     s.EndTime > appointmentTime &&
                     s.IsAvailable, ct);

            if (!hasSchedule) return false;

            // 2. Aynı tarih ve saatte onaylı veya bekleyen çakışan randevu yok mu?
            var hasConflict = await _uow.Appointments.AnyAsync(
                a => a.TeacherId == teacherId &&
                     a.AppointmentDate.Date == appointmentDate.Date &&
                     a.AppointmentDate.Hour == appointmentDate.Hour &&
                     a.Status != AppointmentStatus.Rejected, ct);

            return !hasConflict;
        }

        public async Task<IReadOnlyList<Appointment>> GetStudentAppointmentsAsync(
            int studentId,
            CancellationToken ct = default)
            => await _uow.Appointments.ListAsync(a => a.StudentId == studentId, ct);

        public async Task<IReadOnlyList<Appointment>> GetTeacherAppointmentsAsync(
            int teacherId,
            CancellationToken ct = default)
            => await _uow.Appointments.ListAsync(a => a.TeacherId == teacherId, ct);

        public async Task<Appointment?> UpdateStatusAsync(
            int appointmentId,
            AppointmentStatus newStatus,
            CancellationToken ct = default)
        {
            var appointment = await _uow.Appointments.GetByIdAsync(appointmentId, ct);
            if (appointment is null) return null;

            appointment.Status = newStatus;
            _uow.Appointments.Update(appointment);

            // Randevu onaylandığında ilgili TeacherSchedule bloğunu kapat.
            // Böylece aynı slot başka öğrenciye açık görünmez.
            if (newStatus == AppointmentStatus.Approved)
            {
                var appointmentTime = TimeOnly.FromDateTime(appointment.AppointmentDate);

                var slot = await _uow.TeacherSchedules.FirstOrDefaultAsync(
                    s => s.TeacherId == appointment.TeacherId &&
                         s.DayOfWeek == appointment.AppointmentDate.DayOfWeek &&
                         s.StartTime <= appointmentTime &&
                         s.EndTime > appointmentTime &&
                         s.IsAvailable,
                    ct);

                if (slot is not null)
                {
                    slot.IsAvailable = false;
                    _uow.TeacherSchedules.Update(slot);
                }
            }

            await _uow.SaveChangesAsync(ct);
            return appointment;
        }
    }
}
