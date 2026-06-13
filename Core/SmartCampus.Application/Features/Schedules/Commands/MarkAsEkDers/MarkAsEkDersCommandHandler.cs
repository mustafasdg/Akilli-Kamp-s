using MediatR;
using SmartCampus.Application.Interfaces;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Features.Schedules.Commands.MarkAsEkDers
{
    public class MarkAsEkDersCommandHandler
        : IRequestHandler<MarkAsEkDersCommand, TeacherSchedule>
    {
        private readonly ITeacherScheduleService _scheduleService;

        public MarkAsEkDersCommandHandler(ITeacherScheduleService scheduleService)
        {
            _scheduleService = scheduleService;
        }

        public Task<TeacherSchedule> Handle(
            MarkAsEkDersCommand request,
            CancellationToken cancellationToken)
            => _scheduleService.MarkAsEkDersAsync(
                request.ScheduleId,
                request.TeacherId,
                request.CourseName,
                request.ClassLocation,
                cancellationToken);
    }
}
