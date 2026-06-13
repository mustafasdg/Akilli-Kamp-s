using MediatR;
using SmartCampus.Application.Interfaces;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Features.Schedules.Commands.UpdateSchedule
{
    public class UpdateScheduleCommandHandler
        : IRequestHandler<UpdateScheduleCommand, TeacherSchedule?>
    {
        private readonly ITeacherScheduleService _scheduleService;

        public UpdateScheduleCommandHandler(ITeacherScheduleService scheduleService)
        {
            _scheduleService = scheduleService;
        }

        public Task<TeacherSchedule?> Handle(
            UpdateScheduleCommand request,
            CancellationToken cancellationToken)
            => _scheduleService.UpdateScheduleAsync(
                request.ScheduleId,
                request.TeacherId,
                request.DayOfWeek,
                request.StartTime,
                request.EndTime,
                request.IsAvailable,
                cancellationToken);
    }
}
