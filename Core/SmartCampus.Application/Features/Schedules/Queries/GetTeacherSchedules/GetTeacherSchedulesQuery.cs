using MediatR;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Features.Schedules.Queries.GetTeacherSchedules
{
    public class GetTeacherSchedulesQuery : IRequest<IReadOnlyList<TeacherSchedule>>
    {
        public int TeacherId { get; set; }
    }
}
