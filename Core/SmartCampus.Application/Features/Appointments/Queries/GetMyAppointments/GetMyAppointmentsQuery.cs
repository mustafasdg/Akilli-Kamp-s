using MediatR;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Features.Appointments.Queries.GetMyAppointments
{
    public class GetMyAppointmentsQuery : IRequest<IReadOnlyList<Appointment>>
    {
        public int UserId { get; set; }

        /// <summary>"teacher" ise öğretmen randevuları, aksi halde öğrenci randevuları döner.</summary>
        public string Role { get; set; } = "user";
    }
}
