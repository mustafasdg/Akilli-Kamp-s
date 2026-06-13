using MediatR;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Features.Schedules.Commands.ResetSlot
{
    public class ResetSlotCommand : IRequest<TeacherSchedule?>
    {
        // Controller route'tan doldurur
        public int ScheduleId { get; set; }

        // Controller JWT'den doldurur
        public int TeacherId { get; set; }
    }
}
