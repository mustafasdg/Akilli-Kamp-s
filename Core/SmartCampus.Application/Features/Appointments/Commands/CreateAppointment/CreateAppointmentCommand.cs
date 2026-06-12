using System.ComponentModel.DataAnnotations;
using MediatR;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Features.Appointments.Commands.CreateAppointment
{
    public class CreateAppointmentCommand : IRequest<Appointment>
    {
        // Controller JWT'den doldurur, body'den gelmez
        public int StudentId { get; set; }

        [Required]
        public int TeacherId { get; set; }

        public int? ScheduleId { get; set; }

        [Required]
        public DateTime AppointmentDate { get; set; }

        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;
    }
}
