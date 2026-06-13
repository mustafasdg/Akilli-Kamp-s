using MediatR;
using SmartCampus.Application.Interfaces;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Features.Schedules.Commands.ResetSlot
{
    public class ResetSlotCommandHandler
        : IRequestHandler<ResetSlotCommand, TeacherSchedule?>
    {
        private readonly ITeacherScheduleService _scheduleService;

        public ResetSlotCommandHandler(ITeacherScheduleService scheduleService)
        {
            _scheduleService = scheduleService;
        }

        public Task<TeacherSchedule?> Handle(
            ResetSlotCommand request,
            CancellationToken cancellationToken)
            => _scheduleService.ResetSlotAsync(
                request.ScheduleId,
                request.TeacherId,
                cancellationToken);
    }
}
