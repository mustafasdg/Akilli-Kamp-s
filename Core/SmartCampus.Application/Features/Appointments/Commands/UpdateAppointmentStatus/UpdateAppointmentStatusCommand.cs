using MediatR;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Features.Appointments.Commands.UpdateAppointmentStatus
{
    public class UpdateAppointmentStatusCommand : IRequest<Appointment?>
    {
        public int AppointmentId { get; set; }
        public AppointmentStatus NewStatus { get; set; }
    }
}
