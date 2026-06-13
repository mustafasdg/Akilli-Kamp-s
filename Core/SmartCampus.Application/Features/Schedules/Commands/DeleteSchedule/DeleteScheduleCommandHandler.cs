using MediatR;
using SmartCampus.Application.Interfaces;

namespace SmartCampus.Application.Features.Schedules.Commands.DeleteSchedule
{
    public class DeleteScheduleCommandHandler
        : IRequestHandler<DeleteScheduleCommand, bool>
    {
        private readonly ITeacherScheduleService _scheduleService;

        public DeleteScheduleCommandHandler(ITeacherScheduleService scheduleService)
        {
            _scheduleService = scheduleService;
        }

        public Task<bool> Handle(
            DeleteScheduleCommand request,
            CancellationToken cancellationToken)
            => _scheduleService.DeleteScheduleAsync(
                request.ScheduleId,
                request.TeacherId,
                cancellationToken);
    }
}
