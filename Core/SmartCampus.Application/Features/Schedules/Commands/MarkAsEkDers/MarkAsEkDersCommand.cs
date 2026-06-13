using System.ComponentModel.DataAnnotations;
using MediatR;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Features.Schedules.Commands.MarkAsEkDers
{
    public class MarkAsEkDersCommand : IRequest<TeacherSchedule>
    {
        // Controller route'tan doldurur
        public int ScheduleId { get; set; }

        // Controller JWT'den doldurur
        public int TeacherId { get; set; }

        [Required]
        public string CourseName { get; set; } = string.Empty;

        public string? ClassLocation { get; set; }
    }
}
