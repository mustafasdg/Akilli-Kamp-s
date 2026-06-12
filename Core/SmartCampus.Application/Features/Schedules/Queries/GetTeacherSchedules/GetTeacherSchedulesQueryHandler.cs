using MediatR;
using SmartCampus.Application.Interfaces;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Features.Schedules.Queries.GetTeacherSchedules
{
    public class GetTeacherSchedulesQueryHandler
        : IRequestHandler<GetTeacherSchedulesQuery, IReadOnlyList<TeacherSchedule>>
    {
        private readonly ITeacherScheduleService _scheduleService;

        public GetTeacherSchedulesQueryHandler(ITeacherScheduleService scheduleService)
        {
            _scheduleService = scheduleService;
        }

        public Task<IReadOnlyList<TeacherSchedule>> Handle(
            GetTeacherSchedulesQuery request,
            CancellationToken cancellationToken)
            => _scheduleService.GetTeacherSchedulesAsync(request.TeacherId, cancellationToken);
    }
}
