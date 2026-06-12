using System.ComponentModel.DataAnnotations;
using MediatR;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Features.Schedules.Commands.CreateSchedule
{
    public class CreateScheduleCommand : IRequest<TeacherSchedule>
    {
        // Controller JWT'den doldurur
        public int TeacherId { get; set; }

        [Required]
        public DayOfWeek DayOfWeek { get; set; }

        [Required]
        public TimeOnly StartTime { get; set; }

        [Required]
        public TimeOnly EndTime { get; set; }
    }
}
