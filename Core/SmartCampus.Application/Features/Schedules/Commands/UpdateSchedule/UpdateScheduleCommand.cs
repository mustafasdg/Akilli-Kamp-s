using System.ComponentModel.DataAnnotations;
using MediatR;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Features.Schedules.Commands.UpdateSchedule
{
    public class UpdateScheduleCommand : IRequest<TeacherSchedule?>
    {
        // Controller route'tan doldurur
        public int ScheduleId { get; set; }

        // Controller JWT'den doldurur
        public int TeacherId { get; set; }

        [Required]
        public DayOfWeek DayOfWeek { get; set; }

        [Required]
        public TimeOnly StartTime { get; set; }

        [Required]
        public TimeOnly EndTime { get; set; }

        public bool IsAvailable { get; set; } = true;
    }
}
