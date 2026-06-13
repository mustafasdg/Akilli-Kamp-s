using MediatR;
using SmartCampus.Application.Interfaces;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Features.Appointments.Queries.GetAvailableSlots
{
    public class GetAvailableSlotsQueryHandler
        : IRequestHandler<GetAvailableSlotsQuery, IReadOnlyList<TeacherSchedule>>
    {
        private readonly IAppointmentService _appointmentService;

        public GetAvailableSlotsQueryHandler(IAppointmentService appointmentService)
        {
            _appointmentService = appointmentService;
        }

        public Task<IReadOnlyList<TeacherSchedule>> Handle(
            GetAvailableSlotsQuery request,
            CancellationToken cancellationToken)
            => _appointmentService.GetAvailableSlotsAsync(
                request.TeacherId,
                request.Date,
                cancellationToken);
    }
}
