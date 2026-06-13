using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Interfaces
{
    public interface ITeacherScheduleService
    {
        /// <summary>Öğretmenin haftalık müsaitlik programını getirir.</summary>
        Task<IReadOnlyList<TeacherSchedule>> GetTeacherSchedulesAsync(
            int teacherId,
            CancellationToken ct = default);

        /// <summary>Yeni müsaitlik veya ek ders bloğu oluşturur.</summary>
        Task<TeacherSchedule> CreateScheduleAsync(
            int teacherId,
            DayOfWeek dayOfWeek,
            TimeOnly startTime,
            TimeOnly endTime,
            ScheduleType type = ScheduleType.Müsait,
            string? courseName = null,
            string? classLocation = null,
            CancellationToken ct = default);

        /// <summary>Belirli bir bloğun müsaitlik durumunu günceller.</summary>
        Task<bool> UpdateAvailabilityAsync(
            int scheduleId,
            bool isAvailable,
            CancellationToken ct = default);

        /// <summary>Hocanın kendi slotunu günceller (gün, saat, müsaitlik).</summary>
        Task<TeacherSchedule?> UpdateScheduleAsync(
            int scheduleId,
            int teacherId,
            DayOfWeek dayOfWeek,
            TimeOnly startTime,
            TimeOnly endTime,
            bool isAvailable,
            CancellationToken ct = default);

        /// <summary>Hocanın kendi slotunu siler. Aktif randevu talebi varsa engellenir.</summary>
        Task<bool> DeleteScheduleAsync(
            int scheduleId,
            int teacherId,
            CancellationToken ct = default);

        /// <summary>Müsait slotu EkDers olarak işaretler (silme yok, güncelleme).</summary>
        Task<TeacherSchedule> MarkAsEkDersAsync(
            int scheduleId,
            int teacherId,
            string courseName,
            string? classLocation,
            CancellationToken ct = default);

        /// <summary>EkDers slotunu tekrar Müsait'e çevirir (CourseName/ClassLocation temizlenir).</summary>
        Task<TeacherSchedule?> ResetSlotAsync(
            int scheduleId,
            int teacherId,
            CancellationToken ct = default);
    }
}
