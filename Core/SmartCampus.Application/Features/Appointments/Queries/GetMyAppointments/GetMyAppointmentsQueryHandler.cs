using MediatR;
using SmartCampus.Application.Interfaces;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Features.Appointments.Queries.GetMyAppointments
{
    public class GetMyAppointmentsQueryHandler
        : IRequestHandler<GetMyAppointmentsQuery, IReadOnlyList<Appointment>>
    {
        private readonly IAppointmentService _appointmentService;

        public GetMyAppointmentsQueryHandler(IAppointmentService appointmentService)
        {
            _appointmentService = appointmentService;
        }

        public Task<IReadOnlyList<Appointment>> Handle(
            GetMyAppointmentsQuery request,
            CancellationToken cancellationToken)
        {
            return string.Equals(request.Role, "teacher", StringComparison.OrdinalIgnoreCase)
                ? _appointmentService.GetTeacherAppointmentsAsync(request.UserId, cancellationToken)
                : _appointmentService.GetStudentAppointmentsAsync(request.UserId, cancellationToken);
        }
    }
}
