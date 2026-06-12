using MediatR;
using SmartCampus.Application.Interfaces;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Features.Schedules.Commands.CreateSchedule
{
    public class CreateScheduleCommandHandler
        : IRequestHandler<CreateScheduleCommand, TeacherSchedule>
    {
        private readonly ITeacherScheduleService _scheduleService;

        public CreateScheduleCommandHandler(ITeacherScheduleService scheduleService)
        {
            _scheduleService = scheduleService;
        }

        public Task<TeacherSchedule> Handle(
            CreateScheduleCommand request,
            CancellationToken cancellationToken)
            => _scheduleService.CreateScheduleAsync(
                request.TeacherId,
                request.DayOfWeek,
                request.StartTime,
                request.EndTime,
                cancellationToken);
    }
}
