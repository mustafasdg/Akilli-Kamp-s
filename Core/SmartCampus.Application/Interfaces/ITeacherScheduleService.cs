using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Interfaces
{
    public interface ITeacherScheduleService
    {
        /// <summary>Öğretmenin haftalık müsaitlik programını getirir.</summary>
        Task<IReadOnlyList<TeacherSchedule>> GetTeacherSchedulesAsync(
            int teacherId,
            CancellationToken ct = default);

        /// <summary>Yeni müsaitlik bloğu oluşturur.</summary>
        Task<TeacherSchedule> CreateScheduleAsync(
            int teacherId,
            DayOfWeek dayOfWeek,
            TimeOnly startTime,
            TimeOnly endTime,
            CancellationToken ct = default);

        /// <summary>Belirli bir bloğun müsaitlik durumunu günceller.</summary>
        Task<bool> UpdateAvailabilityAsync(
            int scheduleId,
            bool isAvailable,
            CancellationToken ct = default);
    }
}
