using SmartCampus.Application.Interfaces;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Services
{
    public class AppointmentService : IAppointmentService
    {
        // Mesai sınırları: sistemde 09:00 - 17:00 dışında slot/randevu yaşayamaz
        private static readonly TimeOnly WorkdayStart = new(9, 0);
        private static readonly TimeOnly WorkdayEnd   = new(17, 0);

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
            if (scheduleId.HasValue)
            {
                // Slot doğrulaması: kayıt var mı, bu öğretmene mi ait, tarih slotun gününe uyuyor mu?
                var schedule = await _uow.TeacherSchedules.GetByIdAsync(scheduleId.Value, ct);

                if (schedule is null)
                    throw new InvalidOperationException("Seçilen saat dilimi bulunamadı.");

                if (schedule.TeacherId != teacherId)
                    throw new InvalidOperationException("Seçilen saat dilimi bu öğretmene ait değil.");

                if (!schedule.IsAvailable)
                    throw new InvalidOperationException("Öğretmen seçilen tarih ve saatte müsait değil.");

                // Eski/bozuk veriden gelmiş mesai dışı slot üzerinden randevu alınamaz
                if (schedule.StartTime < WorkdayStart || schedule.StartTime >= WorkdayEnd)
                    throw new InvalidOperationException("Bu saat dilimi mesai saatleri (09:00 - 17:00) dışında.");

                if (appointmentDate.DayOfWeek != schedule.DayOfWeek)
                    throw new InvalidOperationException("Randevu tarihi seçilen saat diliminin gününe uymuyor.");

                // Doluluk kontrolü Appointment tablosundan: aynı slot için aktif talep var mı?
                var hasActive = await _uow.Appointments.AnyAsync(
                    a => a.ScheduleId == scheduleId.Value &&
                         (a.Status == AppointmentStatus.Pending ||
                          a.Status == AppointmentStatus.Approved),
                    ct);

                if (hasActive)
                    throw new InvalidOperationException(
                        "Bu saat dilimi için zaten bekleyen veya onaylanmış bir talep bulunuyor.");

                // UTC/yerel kaymasını kökten kapat: randevu saati her zaman slotun kendi
                // saatinden (yerel duvar saati, Kind=Unspecified) türetilir.
                appointmentDate = DateTime.SpecifyKind(
                    appointmentDate.Date.Add(schedule.StartTime.ToTimeSpan()),
                    DateTimeKind.Unspecified);
            }
            else
            {
                // Slot referansı yoksa saat aralığını doğrudan doğrula — 07:00 gibi
                // mesai dışı bir kaydın veritabanına girme ihtimalini tamamen kapat.
                if (appointmentDate.Hour < 9 || appointmentDate.Hour >= 17)
                    throw new InvalidOperationException(
                        "Randevular yalnızca 09:00 - 17:00 mesai saatleri içinde alınabilir.");

                appointmentDate = DateTime.SpecifyKind(appointmentDate, DateTimeKind.Unspecified);

                var available = await IsTeacherAvailableAsync(teacherId, appointmentDate, ct);
                if (!available)
                    throw new InvalidOperationException("Öğretmen seçilen tarih ve saatte müsait değil.");
            }

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

            // 1. Öğretmenin o saate denk gelen aktif 1-saatlik slotu var mı? (yalnızca mesai içi)
            var hasSchedule = await _uow.TeacherSchedules.AnyAsync(
                s => s.TeacherId == teacherId &&
                     s.DayOfWeek == appointmentDate.DayOfWeek &&
                     s.StartTime <= appointmentTime &&
                     s.EndTime > appointmentTime &&
                     s.StartTime >= WorkdayStart &&
                     s.StartTime < WorkdayEnd &&
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

        public async Task<IReadOnlyList<TeacherSchedule>> GetAvailableSlotsAsync(
            int teacherId,
            DateTime? date = null,
            CancellationToken ct = default)
        {
            // Öğretmenin tanımlı slotları (tarih verildiyse o günün slotları) — yalnızca 09:00-17:00
            IReadOnlyList<TeacherSchedule> slots;
            if (date.HasValue)
            {
                var day = date.Value.DayOfWeek;
                slots = await _uow.TeacherSchedules.ListAsync(
                    s => s.TeacherId == teacherId && s.DayOfWeek == day && s.IsAvailable &&
                         s.StartTime >= WorkdayStart && s.StartTime < WorkdayEnd, ct);
            }
            else
            {
                slots = await _uow.TeacherSchedules.ListAsync(
                    s => s.TeacherId == teacherId && s.IsAvailable &&
                         s.StartTime >= WorkdayStart && s.StartTime < WorkdayEnd, ct);
            }

            if (slots.Count == 0) return slots;

            // Doluluk tek kaynaktan: Appointment tablosundaki aktif (Pending/Approved) talepler
            var activeAppointments = await _uow.Appointments.ListAsync(
                a => a.TeacherId == teacherId &&
                     a.ScheduleId != null &&
                     (a.Status == AppointmentStatus.Pending ||
                      a.Status == AppointmentStatus.Approved),
                ct);

            var bookedIds = activeAppointments.Select(a => a.ScheduleId!.Value).ToHashSet();
            return slots.Where(s => !bookedIds.Contains(s.ID)).ToList();
        }

        public async Task<IReadOnlyList<Appointment>> GetStudentAppointmentsAsync(
            int studentId,
            CancellationToken ct = default)
            => await _uow.Appointments.ListAsync(
                a => a.StudentId == studentId &&
                     a.AppointmentDate.Hour >= 9 && a.AppointmentDate.Hour < 17, ct);

        public async Task<IReadOnlyList<Appointment>> GetTeacherAppointmentsAsync(
            int teacherId,
            CancellationToken ct = default)
            => await _uow.Appointments.ListAsync(
                a => a.TeacherId == teacherId &&
                     a.AppointmentDate.Hour >= 9 && a.AppointmentDate.Hour < 17, ct);

        public async Task<Appointment?> UpdateStatusAsync(
            int appointmentId,
            AppointmentStatus newStatus,
            string? reason = null,
            DateTime? suggestedTime = null,
            CancellationToken ct = default)
        {
            var appointment = await _uow.Appointments.GetByIdAsync(appointmentId, ct);
            if (appointment is null) return null;

            appointment.Status = newStatus;
            _uow.Appointments.Update(appointment);

            // Red: sebep + önerilen saat sakla, öğrenciye bildirim oluştur
            if (newStatus == AppointmentStatus.Rejected)
            {
                // Önerilen saat yerel duvar saati olarak tutulur (Kind=Unspecified) — UTC dönüşümü yok
                if (suggestedTime.HasValue)
                    suggestedTime = DateTime.SpecifyKind(suggestedTime.Value, DateTimeKind.Unspecified);

                appointment.RejectionReason = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim();
                appointment.SuggestedTime   = suggestedTime;

                var teacher     = await _uow.Users.GetByIdAsync(appointment.TeacherId, ct);
                var teacherName = teacher?.Name ?? "Öğretim üyesi";

                var body = $"{teacherName}, {appointment.AppointmentDate:dd.MM.yyyy HH:mm} tarihli randevu talebinizi reddetti.";
                if (appointment.RejectionReason is not null)
                    body += $" Sebep: {appointment.RejectionReason}";
                if (suggestedTime.HasValue)
                    body += $" Önerilen yeni saat: {suggestedTime.Value:dd.MM.yyyy HH:mm}";

                await _uow.Notifications.AddAsync(new Notification
                {
                    UserId        = appointment.StudentId,
                    Title         = "Randevu Talebiniz Reddedildi",
                    Body          = body,
                    AppointmentId = appointment.ID,
                }, ct);
            }

            // Randevu onaylandığında ilgili TeacherSchedule bloğunu kapat.
            if (newStatus == AppointmentStatus.Approved)
            {
                TeacherSchedule? slot = null;

                if (appointment.ScheduleId.HasValue)
                {
                    // scheduleId varsa doğrudan getir — tarih/saat eşleme yok
                    slot = await _uow.TeacherSchedules.GetByIdAsync(appointment.ScheduleId.Value, ct);
                }
                else
                {
                    var appointmentTime = TimeOnly.FromDateTime(appointment.AppointmentDate);
                    slot = await _uow.TeacherSchedules.FirstOrDefaultAsync(
                        s => s.TeacherId == appointment.TeacherId &&
                             s.DayOfWeek == appointment.AppointmentDate.DayOfWeek &&
                             s.StartTime <= appointmentTime &&
                             s.EndTime > appointmentTime &&
                             s.IsAvailable,
                        ct);
                }

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
