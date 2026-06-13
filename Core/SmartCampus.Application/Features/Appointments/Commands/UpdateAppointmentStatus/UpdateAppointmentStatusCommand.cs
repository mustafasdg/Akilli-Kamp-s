using MediatR;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Features.Appointments.Commands.UpdateAppointmentStatus
{
    public class UpdateAppointmentStatusCommand : IRequest<Appointment?>
    {
        public int AppointmentId { get; set; }
        public AppointmentStatus NewStatus { get; set; }

        /// <summary>Red sebebi (yalnızca Rejected için anlamlı).</summary>
        public string? Reason { get; set; }

        /// <summary>Hocanın önerdiği yeni randevu saati (opsiyonel).</summary>
        public DateTime? SuggestedTime { get; set; }
    }
}
