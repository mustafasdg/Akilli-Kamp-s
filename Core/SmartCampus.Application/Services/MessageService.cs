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
                SenderId = senderId,
                ReceiverId = receiverId,
                Content = content.Trim(),
                Timestamp = DateTime.UtcNow,
                IsRead = false
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
