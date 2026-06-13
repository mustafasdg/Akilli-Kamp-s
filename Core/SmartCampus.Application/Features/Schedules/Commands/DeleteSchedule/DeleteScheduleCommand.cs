using MediatR;

namespace SmartCampus.Application.Features.Schedules.Commands.DeleteSchedule
{
    public class DeleteScheduleCommand : IRequest<bool>
    {
        public int ScheduleId { get; set; }

        // Controller JWT'den doldurur
        public int TeacherId { get; set; }
    }
}
