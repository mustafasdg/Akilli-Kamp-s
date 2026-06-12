using MediatR;
using SmartCampus.Application.Interfaces;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Features.Appointments.Commands.CreateAppointment
{
    public class CreateAppointmentCommandHandler
        : IRequestHandler<CreateAppointmentCommand, Appointment>
    {
        private readonly IAppointmentService _appointmentService;

        public CreateAppointmentCommandHandler(IAppointmentService appointmentService)
        {
            _appointmentService = appointmentService;
        }

        public Task<Appointment> Handle(
            CreateAppointmentCommand request,
            CancellationToken cancellationToken)
            => _appointmentService.CreateAppointmentAsync(
                request.StudentId,
                request.TeacherId,
                request.ScheduleId,
                request.AppointmentDate,
                request.Description,
                cancellationToken);
    }
}
