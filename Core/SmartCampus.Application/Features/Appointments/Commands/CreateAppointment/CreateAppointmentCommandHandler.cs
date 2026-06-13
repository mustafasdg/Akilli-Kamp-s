using MediatR;
using SmartCampus.Application.Interfaces;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Features.Appointments.Commands.CreateAppointment
{
    public class CreateAppointmentCommandHandler
        : IRequestHandler<CreateAppointmentCommand, Appointment>
    {
        private readonly IAppointmentService _appointmentService;
        private readonly IMessageService     _messageService;

        public CreateAppointmentCommandHandler(
            IAppointmentService appointmentService,
            IMessageService messageService)
        {
            _appointmentService = appointmentService;
            _messageService     = messageService;
        }

        public async Task<Appointment> Handle(
            CreateAppointmentCommand request,
            CancellationToken cancellationToken)
        {
            // 1) Randevuyu oluştur (randevu mantığı mesaj modülünden izole servis içinde).
            var appointment = await _appointmentService.CreateAppointmentAsync(
                request.StudentId,
                request.TeacherId,
                request.ScheduleId,
                request.AppointmentDate,
                request.Description,
                cancellationToken);

            // 2) Yalnızca randevu BAŞARIYLA oluştuğunda sohbete otomatik sistem mesajı ekle.
            //    Bu mesaj ChatScreen'de interaktif "Randevu Kartı" olarak çizilir.
            //    Öğrenci -> Hoca yönünde gönderilir.
            await _messageService.SendSystemMessageAsync(
                request.StudentId,
                request.TeacherId,
                "Yeni randevu talebi.",
                appointment.ID,
                cancellationToken);

            return appointment;
        }
    }
}
