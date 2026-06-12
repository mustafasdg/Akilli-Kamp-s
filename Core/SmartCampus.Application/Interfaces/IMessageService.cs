using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Interfaces
{
    public interface IMessageService
    {
        /// <summary>Gönderenden alıcıya mesaj gönderir.</summary>
        Task<Message> SendMessageAsync(
            int senderId,
            int receiverId,
            string content,
            CancellationToken ct = default);

        /// <summary>İki kullanıcı arasındaki konuşmayı kronolojik sırayla getirir.</summary>
        Task<IReadOnlyList<Message>> GetConversationAsync(
            int userId1,
            int userId2,
            CancellationToken ct = default);

        /// <summary>Belirtilen kullanıcıya ait tüm okunmamış mesajları okundu olarak işaretler.</summary>
        Task<int> MarkAsReadAsync(
            int receiverId,
            int senderId,
            CancellationToken ct = default);
    }
}
