using SmartCampus.Application.DTOs.Community;
using SmartCampus.Application.Interfaces;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Services
{
    public class CommunityService : ICommunityService
    {
        private readonly IUnitOfWork _uow;

        public CommunityService(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<List<CommunityDto>> GetDiscoverCommunitiesAsync(
            int userId,
            CancellationToken ct = default)
        {
            // Kullanıcının üye olduğu topluluk ID'leri
            var myCommunityIds = await GetMembershipIdsAsync(userId, ct);

            // Üye OLMADIĞI topluluklar (Keşfet)
            var communities = await _uow.Communities.ListAsync(
                c => !myCommunityIds.Contains(c.ID), ct);

            return await MapToDtosAsync(communities, ct);
        }

        public async Task<List<CommunityDto>> GetMyCommunitiesAsync(
            int userId,
            CancellationToken ct = default)
        {
            // Kullanıcının üye olduğu topluluk ID'leri
            var myCommunityIds = await GetMembershipIdsAsync(userId, ct);

            // Üye OLDUĞU topluluklar
            var communities = await _uow.Communities.ListAsync(
                c => myCommunityIds.Contains(c.ID), ct);

            return await MapToDtosAsync(communities, ct);
        }

        public async Task<bool> JoinCommunityAsync(
            int userId,
            int communityId,
            CancellationToken ct = default)
        {
            // Topluluk gerçekten var mı?
            var community = await _uow.Communities.GetByIdAsync(communityId, ct);
            if (community is null) return false;

            // Zaten üye mi? (composite key zaten engeller, yine de anlamlı false dönmek için kontrol)
            var alreadyMember = await _uow.UserCommunities.AnyAsync(
                uc => uc.UserId == userId && uc.CommunityId == communityId, ct);
            if (alreadyMember) return false;

            await _uow.UserCommunities.AddAsync(new UserCommunity
            {
                UserId      = userId,
                CommunityId = communityId,
                JoinedAt    = DateTime.UtcNow,
            }, ct);

            await _uow.SaveChangesAsync(ct);
            return true;
        }

        public async Task<CommunityDto> CreateCommunityAsync(
            CreateCommunityRequest request,
            CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                throw new ArgumentException("Topluluk adı boş olamaz.");

            var community = new Community
            {
                Name        = request.Name.Trim(),
                Description = request.Description?.Trim() ?? string.Empty,
                ImageUrl    = string.IsNullOrWhiteSpace(request.ImageUrl) ? null : request.ImageUrl!.Trim(),
                CreatedAt   = DateTime.UtcNow,
            };

            await _uow.Communities.AddAsync(community, ct);
            await _uow.SaveChangesAsync(ct);

            // Yeni oluşturulan topluluğun henüz üyesi yok
            return new CommunityDto
            {
                Id          = community.ID,
                Name        = community.Name,
                Description = community.Description,
                ImageUrl    = community.ImageUrl,
                MemberCount = 0,
            };
        }

        public async Task<List<CommunityDto>> GetAllCommunitiesAsync(CancellationToken ct = default)
        {
            // Tüm topluluklar (filtre yok) → üye sayılarıyla birlikte DTO'ya çevir
            var communities = await _uow.Communities.ListAsync(_ => true, ct);
            return await MapToDtosAsync(communities, ct);
        }

        public async Task<CommunityDto?> UpdateCommunityAsync(
            int id,
            UpdateCommunityRequest request,
            CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                throw new ArgumentException("Topluluk adı boş olamaz.");

            var community = await _uow.Communities.GetByIdAsync(id, ct);
            if (community is null) return null;

            community.Name        = request.Name.Trim();
            community.Description = request.Description?.Trim() ?? string.Empty;
            community.ImageUrl    = string.IsNullOrWhiteSpace(request.ImageUrl) ? null : request.ImageUrl!.Trim();

            _uow.Communities.Update(community);
            await _uow.SaveChangesAsync(ct);

            // Güncel üye sayısıyla birlikte DTO'yu döndür
            var dtos = await MapToDtosAsync(new List<Community> { community }, ct);
            return dtos.First();
        }

        public async Task<bool> DeleteCommunityAsync(int id, CancellationToken ct = default)
        {
            var community = await _uow.Communities.GetByIdAsync(id, ct);
            if (community is null) return false;

            // İlişkili üyelikler (UserCommunity) ve mesajlar (CommunityMessage)
            // DB seviyesinde Cascade FK'ları sayesinde otomatik silinir.
            _uow.Communities.Remove(community);
            await _uow.SaveChangesAsync(ct);
            return true;
        }

        public Task<bool> IsMemberAsync(int userId, int communityId, CancellationToken ct = default)
            => _uow.UserCommunities.AnyAsync(
                uc => uc.UserId == userId && uc.CommunityId == communityId, ct);

        public async Task<List<CommunityMessageDto>> GetCommunityMessagesAsync(
            int communityId,
            CancellationToken ct = default)
        {
            var messages = await _uow.CommunityMessages.ListAsync(m => m.CommunityId == communityId, ct);
            if (messages.Count == 0) return new List<CommunityMessageDto>();

            // Gönderen adlarını tek sorguda topluca çöz (N+1'den kaçın)
            var senderIds = messages.Select(m => m.UserId).Distinct().ToList();
            var senders = await _uow.Users.ListAsync(u => senderIds.Contains(u.ID), ct);
            var nameMap = senders.ToDictionary(u => u.ID, u => u.Name);

            return messages
                .OrderBy(m => m.SentAt)
                .Select(m => new CommunityMessageDto
                {
                    Id         = m.ID,
                    Content    = m.Content,
                    SentAt     = m.SentAt,
                    SenderId   = m.UserId,
                    SenderName = nameMap.GetValueOrDefault(m.UserId, "Bilinmeyen"),
                })
                .ToList();
        }

        public async Task<CommunityMessageDto> SaveCommunityMessageAsync(
            int communityId,
            int userId,
            string content,
            CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(content))
                throw new ArgumentException("Mesaj içeriği boş olamaz.");

            // Güvenlik: yalnızca topluluğun üyeleri mesaj gönderebilir
            var isMember = await IsMemberAsync(userId, communityId, ct);
            if (!isMember)
                throw new InvalidOperationException("Bu topluluğun üyesi değilsiniz.");

            var message = new CommunityMessage
            {
                CommunityId = communityId,
                UserId      = userId,
                Content     = content.Trim(),
                SentAt      = DateTime.UtcNow,
            };

            await _uow.CommunityMessages.AddAsync(message, ct);
            await _uow.SaveChangesAsync(ct);

            var sender = await _uow.Users.GetByIdAsync(userId, ct);

            return new CommunityMessageDto
            {
                Id         = message.ID,
                Content    = message.Content,
                SentAt     = message.SentAt,
                SenderId   = userId,
                SenderName = sender?.Name ?? "Bilinmeyen",
            };
        }

        /// <summary>Kullanıcının üye olduğu topluluk ID listesini getirir.</summary>
        private async Task<List<int>> GetMembershipIdsAsync(int userId, CancellationToken ct)
        {
            var memberships = await _uow.UserCommunities.ListAsync(
                uc => uc.UserId == userId, ct);

            return memberships.Select(uc => uc.CommunityId).ToList();
        }

        /// <summary>
        /// Topluluk listesini DTO'ya çevirir ve üye sayılarını tek sorguda
        /// toplu hesaplar (topluluk başına ayrı sorgu açmaz; N+1'den kaçınır).
        /// </summary>
        private async Task<List<CommunityDto>> MapToDtosAsync(
            IReadOnlyList<Community> communities,
            CancellationToken ct)
        {
            if (communities.Count == 0) return new List<CommunityDto>();

            var communityIds = communities.Select(c => c.ID).ToList();

            // İlgili topluluklara ait tüm üyelik kayıtları (üye sayımı için)
            var memberships = await _uow.UserCommunities.ListAsync(
                uc => communityIds.Contains(uc.CommunityId), ct);

            var memberCounts = memberships
                .GroupBy(uc => uc.CommunityId)
                .ToDictionary(g => g.Key, g => g.Count());

            return communities
                .Select(c => new CommunityDto
                {
                    Id          = c.ID,
                    Name        = c.Name,
                    Description = c.Description,
                    ImageUrl    = c.ImageUrl,
                    MemberCount = memberCounts.GetValueOrDefault(c.ID, 0),
                })
                .ToList();
        }
    }
}
