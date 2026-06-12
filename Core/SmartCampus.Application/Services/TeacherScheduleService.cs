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
            => await _uow.TeacherSchedules.ListAsync(s => s.TeacherId == teacherId, ct);

        public async Task<TeacherSchedule> CreateScheduleAsync(
            int teacherId,
            DayOfWeek dayOfWeek,
            TimeOnly startTime,
            TimeOnly endTime,
            CancellationToken ct = default)
        {
            // Çakışan blok kontrolü: aynı gün, bitiş > yeni başlangıç ve başlangıç < yeni bitiş
            var hasConflict = await _uow.TeacherSchedules.AnyAsync(
                s => s.TeacherId == teacherId &&
                     s.DayOfWeek == dayOfWeek &&
                     s.StartTime < endTime &&
                     s.EndTime > startTime, ct);

            if (hasConflict)
                throw new InvalidOperationException("Seçilen zaman diliminde çakışan bir program bloğu mevcut.");

            var schedule = new TeacherSchedule
            {
                TeacherId = teacherId,
                DayOfWeek = dayOfWeek,
                StartTime = startTime,
                EndTime = endTime,
                IsAvailable = true
            };

            await _uow.TeacherSchedules.AddAsync(schedule, ct);
            await _uow.SaveChangesAsync(ct);
            return schedule;
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
    }
}
