using MediatR;
using SmartCampus.Application.Interfaces;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Features.Appointments.Commands.UpdateAppointmentStatus
{
    public class UpdateAppointmentStatusCommandHandler
        : IRequestHandler<UpdateAppointmentStatusCommand, Appointment?>
    {
        private readonly IAppointmentService _appointmentService;

        public UpdateAppointmentStatusCommandHandler(IAppointmentService appointmentService)
        {
            _appointmentService = appointmentService;
        }

        public Task<Appointment?> Handle(
            UpdateAppointmentStatusCommand request,
            CancellationToken cancellationToken)
            => _appointmentService.UpdateStatusAsync(
                request.AppointmentId,
                request.NewStatus,
                cancellationToken);
    }
}
