using SmartCampus.Application.Features.Messages.Queries.GetConversations;
using SmartCampus.Application.Interfaces;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Services
{
    public class MessageService : IMessageService
    {
        private readonly IUnitOfWork _uow;

        public MessageService(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<Message> SendMessageAsync(
            int senderId,
            int receiverId,
            string content,
            CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(content))
                throw new ArgumentException("Mesaj içeriği boş olamaz.");

            var message = new Message
            {
                SenderId   = senderId,
                ReceiverId = receiverId,
                Content    = content.Trim(),
                Timestamp  = DateTime.UtcNow,
                IsRead     = false,
            };

            await _uow.Messages.AddAsync(message, ct);
            await _uow.SaveChangesAsync(ct);
            return message;
        }

        public async Task<Message> SendSystemMessageAsync(
            int senderId,
            int receiverId,
            string content,
            int relatedAppointmentId,
            CancellationToken ct = default)
        {
            var message = new Message
            {
                SenderId             = senderId,
                ReceiverId           = receiverId,
                Content              = content.Trim(),
                Timestamp            = DateTime.UtcNow,
                IsRead               = false,
                IsSystemMessage      = true,
                RelatedAppointmentId = relatedAppointmentId,
            };

            await _uow.Messages.AddAsync(message, ct);
            await _uow.SaveChangesAsync(ct);
            return message;
        }

        public async Task<IReadOnlyList<Message>> GetConversationAsync(
            int userId1,
            int userId2,
            CancellationToken ct = default)
        {
            var messages = await _uow.Messages.ListAsync(
                m => (m.SenderId == userId1 && m.ReceiverId == userId2) ||
                     (m.SenderId == userId2 && m.ReceiverId == userId1),
                ct);

            // Kronolojik sıralama (ListAsync ordering yok, bellekte sırala)
            return messages.OrderBy(m => m.Timestamp).ToList();
        }

        public async Task<IReadOnlyList<ConversationSummaryDto>> GetConversationsAsync(
            int userId,
            CancellationToken ct = default)
        {
            var messages = await _uow.Messages.ListAsync(
                m => m.SenderId == userId || m.ReceiverId == userId,
                ct);

            if (messages.Count == 0) return Array.Empty<ConversationSummaryDto>();

            var partnerIds = messages
                .Select(m => m.SenderId == userId ? m.ReceiverId : m.SenderId)
                .Distinct()
                .ToList();

            var partnerNames = new Dictionary<int, string>();
            foreach (var pid in partnerIds)
            {
                var user = await _uow.Users.GetByIdAsync(pid, ct);
                if (user != null) partnerNames[pid] = user.Name;
            }

            return messages
                .GroupBy(m => m.SenderId == userId ? m.ReceiverId : m.SenderId)
                .Select(g =>
                {
                    var last = g.OrderByDescending(m => m.Timestamp).First();
                    return new ConversationSummaryDto
                    {
                        PartnerId = g.Key,
                        PartnerName = partnerNames.GetValueOrDefault(g.Key, "Bilinmeyen"),
                        LastMessage = last.Content,
                        LastMessageTime = last.Timestamp,
                        UnreadCount = g.Count(m => m.SenderId != userId && !m.IsRead),
                    };
                })
                .OrderByDescending(c => c.LastMessageTime)
                .ToList();
        }

        public async Task<IReadOnlyList<ConversationSummaryDto>> GetTeacherConversationsAsync(
            int teacherId,
            CancellationToken ct = default)
        {
            // Randevu almış tüm öğrenciler
            var appointments = await _uow.Appointments.ListAsync(
                a => a.TeacherId == teacherId, ct);

            // Bu hocanın mesajları
            var messages = await _uow.Messages.ListAsync(
                m => m.SenderId == teacherId || m.ReceiverId == teacherId, ct);

            // Tüm partner ID'lerini birleştir (appointment'tan gelen + mesajdan gelen)
            var appointmentStudentIds = appointments.Select(a => a.StudentId).ToHashSet();
            var messagePartnerIds = messages
                .Select(m => m.SenderId == teacherId ? m.ReceiverId : m.SenderId)
                .ToHashSet();

            var allPartnerIds = appointmentStudentIds.Union(messagePartnerIds).ToList();
            if (allPartnerIds.Count == 0) return Array.Empty<ConversationSummaryDto>();

            // Partner isimlerini toplu getir
            var partnerNames = new Dictionary<int, string>();
            foreach (var pid in allPartnerIds)
            {
                var user = await _uow.Users.GetByIdAsync(pid, ct);
                if (user != null) partnerNames[pid] = user.Name;
            }

            return allPartnerIds
                .Select(pid =>
                {
                    // Bu partner ile olan mesajlar
                    var partnerMessages = messages
                        .Where(m => (m.SenderId == pid && m.ReceiverId == teacherId) ||
                                    (m.SenderId == teacherId && m.ReceiverId == pid))
                        .OrderByDescending(m => m.Timestamp)
                        .ToList();

                    var lastMsg = partnerMessages.FirstOrDefault();

                    // Mesaj yoksa en son randevu tarihini fallback olarak kullan
                    var fallbackTime = appointments
                        .Where(a => a.StudentId == pid)
                        .OrderByDescending(a => a.AppointmentDate)
                        .Select(a => a.AppointmentDate)
                        .FirstOrDefault();

                    return new ConversationSummaryDto
                    {
                        PartnerId       = pid,
                        PartnerName     = partnerNames.GetValueOrDefault(pid, "Bilinmeyen"),
                        LastMessage     = lastMsg?.Content ?? string.Empty,
                        LastMessageTime = lastMsg?.Timestamp ?? fallbackTime,
                        UnreadCount     = partnerMessages.Count(m => m.ReceiverId == teacherId && !m.IsRead),
                    };
                })
                .OrderByDescending(c => c.LastMessageTime)
                .ToList();
        }

        public async Task<int> MarkAsReadAsync(
            int receiverId,
            int senderId,
            CancellationToken ct = default)
        {
            // Belirli gönderenden gelen okunmamış mesajları getir
            var unread = await _uow.Messages.ListAsync(
                m => m.ReceiverId == receiverId &&
                     m.SenderId == senderId &&
                     !m.IsRead,
                ct);

            foreach (var message in unread)
            {
                message.IsRead = true;
                _uow.Messages.Update(message);
            }

            if (unread.Count > 0)
                await _uow.SaveChangesAsync(ct);

            return unread.Count;
        }
    }
}
