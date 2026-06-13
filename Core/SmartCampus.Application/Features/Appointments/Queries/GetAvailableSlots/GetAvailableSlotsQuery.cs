using MediatR;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Features.Appointments.Queries.GetAvailableSlots
{
    public class GetAvailableSlotsQuery : IRequest<IReadOnlyList<TeacherSchedule>>
    {
        public int TeacherId { get; set; }

        /// <summary>Verilirse sadece o günün slotları döner.</summary>
        public DateTime? Date { get; set; }
    }
}
