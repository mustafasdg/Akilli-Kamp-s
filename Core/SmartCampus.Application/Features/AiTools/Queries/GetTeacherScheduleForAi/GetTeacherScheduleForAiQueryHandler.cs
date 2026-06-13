using MediatR;
using SmartCampus.Application.Interfaces;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Features.AiTools.Queries.GetTeacherScheduleForAi
{
    public class GetTeacherScheduleForAiQueryHandler
        : IRequestHandler<GetTeacherScheduleForAiQuery, IReadOnlyList<AiScheduleDto>>
    {
        // Sistem mesai sınırları: yalnızca 09:00 - 17:00 arası bloklar anlamlıdır
        // (mesai dışı eski kayıtlar ajana sızmasın).
        private static readonly TimeOnly WorkdayStart = new(9, 0);
        private static readonly TimeOnly WorkdayEnd   = new(17, 0);

        private readonly IUnitOfWork _uow;

        public GetTeacherScheduleForAiQueryHandler(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<IReadOnlyList<AiScheduleDto>> Handle(
            GetTeacherScheduleForAiQuery request,
            CancellationToken cancellationToken)
        {
            // Öğretmenin mesai içi haftalık blokları (Müsait + Ders + EkDers).
            var slots = await _uow.TeacherSchedules.ListAsync(
                s => s.TeacherId == request.TeacherId &&
                     s.StartTime >= WorkdayStart && s.StartTime < WorkdayEnd,
                cancellationToken);

            if (slots.Count == 0)
                return new List<AiScheduleDto>();

            // Doluluğun tek kaynağı: Appointment tablosundaki aktif (Pending/Approved) talepler.
            var activeAppointments = await _uow.Appointments.ListAsync(
                a => a.TeacherId == request.TeacherId &&
                     a.ScheduleId != null &&
                     (a.Status == AppointmentStatus.Pending ||
                      a.Status == AppointmentStatus.Approved),
                cancellationToken);

            var bookedSlotIds = activeAppointments.Select(a => a.ScheduleId!.Value).ToHashSet();

            return slots
                .OrderBy(s => s.DayOfWeek)
                .ThenBy(s => s.StartTime)
                .Select(s => new AiScheduleDto
                {
                    DayOfWeek = s.DayOfWeek.ToString(),
                    StartTime = s.StartTime.ToString("HH:mm"),
                    EndTime   = s.EndTime.ToString("HH:mm"),
                    // Boş slot = Müsait tipinde + slot bayrağı açık + aktif randevusu yok.
                    // Ders/EkDers veya dolu randevu ⇒ false (randevu/ders çakışması kontrolü).
                    IsAvailable = s.Type == ScheduleType.Müsait &&
                                  s.IsAvailable &&
                                  !bookedSlotIds.Contains(s.ID),
                })
                .ToList();
        }
    }
}
