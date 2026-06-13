using MediatR;
using SmartCampus.Application.Interfaces;

namespace SmartCampus.Application.Features.Messages.Queries.GetConversation
{
    public class GetConversationQueryHandler
        : IRequestHandler<GetConversationQuery, IReadOnlyList<MessageDto>>
    {
        private readonly IMessageService _messageService;
        private readonly IUnitOfWork     _uow;

        public GetConversationQueryHandler(IMessageService messageService, IUnitOfWork uow)
        {
            _messageService = messageService;
            _uow            = uow;
        }

        public async Task<IReadOnlyList<MessageDto>> Handle(
            GetConversationQuery request,
            CancellationToken cancellationToken)
        {
            var messages = await _messageService.GetConversationAsync(
                request.UserId1, request.UserId2, cancellationToken);

            // Sistem mesajlarının bağlı olduğu randevuların GÜNCEL durumunu toplu yükle.
            // (Repository EF .Include desteklemediği için randevular ayrı sorguyla çekilir;
            //  GetByIdAsync/ListAsync her istekte DB'ye gittiğinden Status her zaman günceldir.)
            var appointmentIds = messages
                .Where(m => m.RelatedAppointmentId.HasValue)
                .Select(m => m.RelatedAppointmentId!.Value)
                .Distinct()
                .ToList();

            var appointmentMap = new Dictionary<int, AppointmentInfoDto>();

            if (appointmentIds.Count > 0)
            {
                var appointments = await _uow.Appointments.ListAsync(
                    a => appointmentIds.Contains(a.ID), cancellationToken);

                var userIds = appointments
                    .SelectMany(a => new[] { a.StudentId, a.TeacherId })
                    .Distinct()
                    .ToList();

                var users     = await _uow.Users.ListAsync(u => userIds.Contains(u.ID), cancellationToken);
                var userNames = users.ToDictionary(u => u.ID, u => u.Name);

                foreach (var appt in appointments)
                {
                    appointmentMap[appt.ID] = new AppointmentInfoDto
                    {
                        Id              = appt.ID,
                        AppointmentDate = appt.AppointmentDate,
                        Status          = (int)appt.Status,
                        Description     = appt.Description,
                        TeacherName     = userNames.GetValueOrDefault(appt.TeacherId, string.Empty),
                        StudentName     = userNames.GetValueOrDefault(appt.StudentId, string.Empty),
                        RejectionReason = appt.RejectionReason,
                    };
                }
            }

            return messages.Select(m => new MessageDto
            {
                Id                   = m.ID,
                SenderId             = m.SenderId,
                ReceiverId           = m.ReceiverId,
                Content              = m.Content,
                Timestamp            = m.Timestamp,
                IsRead               = m.IsRead,
                IsSystemMessage      = m.IsSystemMessage,
                RelatedAppointmentId = m.RelatedAppointmentId,
                RelatedAppointment   = m.RelatedAppointmentId.HasValue
                    ? appointmentMap.GetValueOrDefault(m.RelatedAppointmentId.Value)
                    : null,
            }).ToList();
        }
    }
}
