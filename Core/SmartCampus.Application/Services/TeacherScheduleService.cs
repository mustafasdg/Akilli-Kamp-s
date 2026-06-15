using SmartCampus.Application.Interfaces;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Services
{
    public class TeacherScheduleService : ITeacherScheduleService
    {
        private readonly IUnitOfWork _uow;

        public TeacherScheduleService(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<IReadOnlyList<TeacherSchedule>> GetTeacherSchedulesAsync(
            int teacherId,
            CancellationToken ct = default)
        {
            // Mesai dışı (örn. 07:00) eski kayıtlar hiçbir istemciye sızmasın
            var slots = await _uow.TeacherSchedules.ListAsync(
                s => s.TeacherId == teacherId &&
                     s.StartTime >= WorkdayStart && s.StartTime < WorkdayEnd, ct);

            if (slots.Count == 0) return slots;

            // Slot durumunu (Available/Booked/Pending) Appointment tablosundan türet.
            // Tek seferde öğretmenin aktif (bekleyen/onaylı) taleplerini çekip her slota eşleştir.
            var activeAppointments = await _uow.Appointments.ListAsync(
                a => a.TeacherId == teacherId &&
                     (a.Status == AppointmentStatus.Pending ||
                      a.Status == AppointmentStatus.Approved), ct);

            foreach (var slot in slots)
            {
                // Ders/EkDers slotları randevuya kapalı; durum istemcide Type üzerinden çizilir.
                if (slot.Type != ScheduleType.Müsait)
                {
                    slot.Status = SlotStatus.Available;
                    continue;
                }

                var hasApproved = activeAppointments.Any(
                    a => MatchesSlot(a, slot) && a.Status == AppointmentStatus.Approved);
                var hasPending = activeAppointments.Any(
                    a => MatchesSlot(a, slot) && a.Status == AppointmentStatus.Pending);

                slot.Status =
                    hasApproved        ? SlotStatus.Booked  :
                    hasPending         ? SlotStatus.Pending :
                    !slot.IsAvailable  ? SlotStatus.Booked  :
                                         SlotStatus.Available;
            }

            return slots;
        }

        // Bir randevuyu bir slota eşleştirir: önce ScheduleId, yoksa (AI/eski kayıtlar için)
        // gün + saat aralığı üzerinden. Slotlar haftalık tekrarlı olduğundan tarihe değil,
        // güne ve saate bakılır (mevcut istemci davranışıyla tutarlı).
        private static bool MatchesSlot(Appointment a, TeacherSchedule s)
        {
            if (a.ScheduleId == s.ID) return true;
            if (a.ScheduleId != null) return false; // başka bir slota bağlı

            var time = TimeOnly.FromDateTime(a.AppointmentDate);
            return a.AppointmentDate.DayOfWeek == s.DayOfWeek &&
                   time >= s.StartTime && time < s.EndTime;
        }

        // Mesai sınırları: tüm slotlar 09:00 - 17:00 arasında ve tam 1 saat olmalı
        private static readonly TimeOnly WorkdayStart = new(9, 0);
        private static readonly TimeOnly WorkdayEnd   = new(17, 0);

        private static void ValidateSlot(DayOfWeek dayOfWeek, TimeOnly startTime, TimeOnly endTime)
        {
            if (dayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
                throw new InvalidOperationException("Slotlar yalnızca hafta içi günlere eklenebilir.");

            if (startTime < WorkdayStart || endTime > WorkdayEnd)
                throw new InvalidOperationException("Slotlar 09:00 - 17:00 mesai saatleri içinde olmalıdır.");

            if (endTime - startTime != TimeSpan.FromHours(1))
                throw new InvalidOperationException("Her slot tam 1 saat olmalıdır (örn. 09:00 - 10:00).");

            if (startTime.Minute != 0)
                throw new InvalidOperationException("Slotlar tam saat başında başlamalıdır (örn. 09:00, 10:00).");
        }

        public async Task<TeacherSchedule> CreateScheduleAsync(
            int teacherId,
            DayOfWeek dayOfWeek,
            TimeOnly startTime,
            TimeOnly endTime,
            ScheduleType type = ScheduleType.Müsait,
            string? courseName = null,
            string? classLocation = null,
            CancellationToken ct = default)
        {
            ValidateSlot(dayOfWeek, startTime, endTime);

            if (type == ScheduleType.EkDers)
            {
                // Sabit ders saatiyle çakışma — EkDers eklenemez
                var hasDerc = await _uow.TeacherSchedules.AnyAsync(
                    s => s.TeacherId == teacherId &&
                         s.DayOfWeek == dayOfWeek &&
                         s.StartTime < endTime &&
                         s.EndTime > startTime &&
                         s.Type == ScheduleType.Ders, ct);

                if (hasDerc)
                    throw new InvalidOperationException("Bu saatte sabit ders bulunduğundan Ek Ders eklenemez.");

                // Aynı saatte zaten EkDers varsa engelle
                var hasEkDers = await _uow.TeacherSchedules.AnyAsync(
                    s => s.TeacherId == teacherId &&
                         s.DayOfWeek == dayOfWeek &&
                         s.StartTime < endTime &&
                         s.EndTime > startTime &&
                         s.Type == ScheduleType.EkDers, ct);

                if (hasEkDers)
                    throw new InvalidOperationException("Bu saatte zaten bir Ek Ders bulunuyor.");

                // Aynı saatte Müsait slot varsa: aktif randevu kontrolü yap, yoksa kaldır
                var musaitSlot = await _uow.TeacherSchedules.FirstOrDefaultAsync(
                    s => s.TeacherId == teacherId &&
                         s.DayOfWeek == dayOfWeek &&
                         s.StartTime < endTime &&
                         s.EndTime > startTime &&
                         s.Type == ScheduleType.Müsait, ct);

                if (musaitSlot is not null)
                {
                    var hasActiveAppointment = await _uow.Appointments.AnyAsync(
                        a => a.ScheduleId == musaitSlot.ID &&
                             (a.Status == AppointmentStatus.Pending ||
                              a.Status == AppointmentStatus.Approved), ct);

                    if (hasActiveAppointment)
                        throw new InvalidOperationException("Bu saatte öğrenci randevunuz bulunuyor.");

                    _uow.TeacherSchedules.Remove(musaitSlot);
                }
            }
            else // Müsait
            {
                var hasConflict = await _uow.TeacherSchedules.AnyAsync(
                    s => s.TeacherId == teacherId &&
                         s.DayOfWeek == dayOfWeek &&
                         s.StartTime < endTime &&
                         s.EndTime > startTime, ct);

                if (hasConflict)
                    throw new InvalidOperationException("Seçilen zaman diliminde çakışan bir program bloğu mevcut.");
            }

            var schedule = new TeacherSchedule
            {
                TeacherId     = teacherId,
                DayOfWeek     = dayOfWeek,
                StartTime     = startTime,
                EndTime       = endTime,
                Type          = type,
                IsAvailable   = type == ScheduleType.Müsait,
                CourseName    = courseName?.Trim(),
                ClassLocation = classLocation?.Trim(),
            };

            await _uow.TeacherSchedules.AddAsync(schedule, ct);
            await _uow.SaveChangesAsync(ct);
            return schedule;
        }

        public async Task<TeacherSchedule?> UpdateScheduleAsync(
            int scheduleId,
            int teacherId,
            DayOfWeek dayOfWeek,
            TimeOnly startTime,
            TimeOnly endTime,
            bool isAvailable,
            CancellationToken ct = default)
        {
            var schedule = await _uow.TeacherSchedules.GetByIdAsync(scheduleId, ct);
            if (schedule is null) return null;

            if (schedule.TeacherId != teacherId)
                throw new InvalidOperationException("Bu program bloğu size ait değil.");

            ValidateSlot(dayOfWeek, startTime, endTime);

            // Kendisi hariç çakışma kontrolü
            var hasConflict = await _uow.TeacherSchedules.AnyAsync(
                s => s.ID != scheduleId &&
                     s.TeacherId == teacherId &&
                     s.DayOfWeek == dayOfWeek &&
                     s.StartTime < endTime &&
                     s.EndTime > startTime, ct);

            if (hasConflict)
                throw new InvalidOperationException("Seçilen zaman diliminde çakışan bir program bloğu mevcut.");

            schedule.DayOfWeek   = dayOfWeek;
            schedule.StartTime   = startTime;
            schedule.EndTime     = endTime;
            schedule.IsAvailable = isAvailable;

            _uow.TeacherSchedules.Update(schedule);
            await _uow.SaveChangesAsync(ct);
            return schedule;
        }

        public async Task<bool> DeleteScheduleAsync(
            int scheduleId,
            int teacherId,
            CancellationToken ct = default)
        {
            var schedule = await _uow.TeacherSchedules.GetByIdAsync(scheduleId, ct);
            if (schedule is null) return false;

            if (schedule.TeacherId != teacherId)
                throw new InvalidOperationException("Bu program bloğu size ait değil.");

            // Sabit sistem dersleri silinemez
            if (schedule.Type == ScheduleType.Ders)
                throw new InvalidOperationException("Sabit sistem dersleri silinemez.");

            // Slota bağlı aktif (bekleyen/onaylı) randevu varsa silmeyi engelle
            var hasActiveAppointment = await _uow.Appointments.AnyAsync(
                a => a.ScheduleId == scheduleId &&
                     (a.Status == AppointmentStatus.Pending ||
                      a.Status == AppointmentStatus.Approved), ct);

            if (hasActiveAppointment)
                throw new InvalidOperationException(
                    "Bu slota bağlı bekleyen veya onaylanmış randevu var. Önce talepleri sonuçlandırın.");

            _uow.TeacherSchedules.Remove(schedule);
            await _uow.SaveChangesAsync(ct);
            return true;
        }

        public async Task<bool> UpdateAvailabilityAsync(
            int scheduleId,
            bool isAvailable,
            CancellationToken ct = default)
        {
            var schedule = await _uow.TeacherSchedules.GetByIdAsync(scheduleId, ct);
            if (schedule is null) return false;

            schedule.IsAvailable = isAvailable;
            _uow.TeacherSchedules.Update(schedule);
            await _uow.SaveChangesAsync(ct);
            return true;
        }

        public async Task<TeacherSchedule> MarkAsEkDersAsync(
            int scheduleId,
            int teacherId,
            string courseName,
            string? classLocation,
            CancellationToken ct = default)
        {
            var slot = await _uow.TeacherSchedules.GetByIdAsync(scheduleId, ct);
            if (slot is null)
                throw new InvalidOperationException("Slot bulunamadı.");

            if (slot.TeacherId != teacherId)
                throw new InvalidOperationException("Bu slot size ait değil.");

            if (slot.Type == ScheduleType.Ders)
                throw new InvalidOperationException("Sabit sistem dersleri değiştirilemez.");

            if (slot.Type == ScheduleType.EkDers)
                throw new InvalidOperationException("Bu slot zaten Ek Ders olarak işaretli.");

            var hasActive = await _uow.Appointments.AnyAsync(
                a => a.ScheduleId == scheduleId &&
                     (a.Status == AppointmentStatus.Pending ||
                      a.Status == AppointmentStatus.Approved), ct);

            if (hasActive)
                throw new InvalidOperationException("Bu saatte öğrenci randevunuz bulunuyor.");

            slot.Type          = ScheduleType.EkDers;
            slot.IsAvailable   = false;
            slot.CourseName    = courseName.Trim();
            slot.ClassLocation = classLocation?.Trim();

            _uow.TeacherSchedules.Update(slot);
            await _uow.SaveChangesAsync(ct);
            return slot;
        }

        public async Task<TeacherSchedule?> ResetSlotAsync(
            int scheduleId,
            int teacherId,
            CancellationToken ct = default)
        {
            var slot = await _uow.TeacherSchedules.GetByIdAsync(scheduleId, ct);
            if (slot is null) return null;

            if (slot.TeacherId != teacherId)
                throw new InvalidOperationException("Bu slot size ait değil.");

            if (slot.Type == ScheduleType.Ders)
                throw new InvalidOperationException("Sabit sistem dersleri sıfırlanamaz.");

            if (slot.Type == ScheduleType.Müsait)
                throw new InvalidOperationException("Bu slot zaten Müsait.");

            slot.Type          = ScheduleType.Müsait;
            slot.IsAvailable   = true;
            slot.CourseName    = null;
            slot.ClassLocation = null;

            _uow.TeacherSchedules.Update(slot);
            await _uow.SaveChangesAsync(ct);
            return slot;
        }
    }
}
