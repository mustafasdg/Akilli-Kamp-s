using SmartCampus.Application.Features.Messages.Queries.GetConversations;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Interfaces
{
    public interface IMessageService
    {
        /// <summary>Gönderenden alıcıya düz metin mesajı gönderir.</summary>
        Task<Message> SendMessageAsync(
            int senderId,
            int receiverId,
            string content,
            CancellationToken ct = default);

        /// <summary>
        /// Bir randevuya bağlı sistem mesajı (interaktif randevu kartı) oluşturur.
        /// IsSystemMessage = true olarak işaretlenir.
        /// </summary>
        Task<Message> SendSystemMessageAsync(
            int senderId,
            int receiverId,
            string content,
            int relatedAppointmentId,
            CancellationToken ct = default);

        /// <summary>İki kullanıcı arasındaki konuşmayı kronolojik sırayla getirir.</summary>
        Task<IReadOnlyList<Message>> GetConversationAsync(
            int userId1,
            int userId2,
            CancellationToken ct = default);

        /// <summary>Kullanıcının tüm aktif konuşmalarını özet olarak getirir.</summary>
        Task<IReadOnlyList<ConversationSummaryDto>> GetConversationsAsync(
            int userId,
            CancellationToken ct = default);

        /// <summary>
        /// Öğretmenin tüm öğrencilerini getirir: randevu almış VEYA mesajlaşmış.
        /// Her öğrenci için varsa son mesajı, yoksa randevu kaydı zamanını kullanır.
        /// </summary>
        Task<IReadOnlyList<ConversationSummaryDto>> GetTeacherConversationsAsync(
            int teacherId,
            CancellationToken ct = default);

        /// <summary>Belirtilen kullanıcıya ait tüm okunmamış mesajları okundu olarak işaretler.</summary>
        Task<int> MarkAsReadAsync(
            int receiverId,
            int senderId,
            CancellationToken ct = default);
    }
}
