using SmartCampus.Application.DTOs.Community;

namespace SmartCampus.Application.Interfaces
{
    public interface ICommunityService
    {
        /// <summary>
        /// Kullanıcının HENÜZ ÜYE OLMADIĞI toplulukları (Keşfet listesi) getirir.
        /// </summary>
        Task<List<CommunityDto>> GetDiscoverCommunitiesAsync(int userId, CancellationToken ct = default);

        /// <summary>
        /// Kullanıcının ÜYE OLDUĞU toplulukları getirir.
        /// </summary>
        Task<List<CommunityDto>> GetMyCommunitiesAsync(int userId, CancellationToken ct = default);

        /// <summary>
        /// Kullanıcıyı topluluğa üye yapar (UserCommunity tablosuna kayıt atar).
        /// Topluluk bulunamazsa veya kullanıcı zaten üyeyse false döner.
        /// </summary>
        Task<bool> JoinCommunityAsync(int userId, int communityId, CancellationToken ct = default);

        /// <summary>
        /// Yeni bir topluluk oluşturur (admin işlemi) ve oluşturulan topluluğu DTO olarak döner.
        /// </summary>
        Task<CommunityDto> CreateCommunityAsync(CreateCommunityRequest request, CancellationToken ct = default);

        /// <summary>
        /// Sistemdeki TÜM toplulukları getirir (admin yönetim ekranı için).
        /// </summary>
        Task<List<CommunityDto>> GetAllCommunitiesAsync(CancellationToken ct = default);

        /// <summary>
        /// Mevcut bir topluluğu günceller (admin). Topluluk bulunamazsa null döner.
        /// </summary>
        Task<CommunityDto?> UpdateCommunityAsync(int id, UpdateCommunityRequest request, CancellationToken ct = default);

        /// <summary>
        /// Bir topluluğu siler (ilişkili üyelikler ve mesajlar dahil). Bulunamazsa false döner.
        /// </summary>
        Task<bool> DeleteCommunityAsync(int id, CancellationToken ct = default);

        /// <summary>
        /// Kullanıcının ilgili topluluğa üye olup olmadığını döner.
        /// (SignalR grubuna katılım ve mesaj yetkilendirmesi için kullanılır.)
        /// </summary>
        Task<bool> IsMemberAsync(int userId, int communityId, CancellationToken ct = default);

        /// <summary>
        /// Topluluğun geçmiş mesajlarını kronolojik (eskiden yeniye) sırayla getirir.
        /// </summary>
        Task<List<CommunityMessageDto>> GetCommunityMessagesAsync(int communityId, CancellationToken ct = default);

        /// <summary>
        /// Bir topluluk mesajını kaydeder, gönderenin adını çözer ve DTO olarak döner.
        /// Kullanıcı topluluğa üye değilse InvalidOperationException fırlatır.
        /// </summary>
        Task<CommunityMessageDto> SaveCommunityMessageAsync(
            int communityId, int userId, string content, CancellationToken ct = default);
    }
}
