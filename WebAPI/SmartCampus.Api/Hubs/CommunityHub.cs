using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using SmartCampus.Application.Interfaces;

namespace SmartCampus.Api.Hubs
{
    /// <summary>
    /// Topluluk içi gerçek zamanlı sohbet hub'ı.
    /// Her topluluk "community_{id}" adlı bir SignalR grubudur; istemciler yalnızca
    /// katıldıkları grupların "ReceiveMessage" event'lerini alır.
    /// </summary>
    [Authorize]
    public class CommunityHub : Hub
    {
        private readonly ICommunityService _communityService;

        public CommunityHub(ICommunityService communityService)
        {
            _communityService = communityService;
        }

        private static string GroupName(int communityId) => $"community_{communityId}";

        /// <summary>Kullanıcıyı ilgili topluluğun SignalR grubuna ekler (yalnızca üyeler).</summary>
        public async Task JoinGroup(int communityId)
        {
            var userId = GetUserId();
            if (userId is null)
                throw new HubException("Kimlik doğrulanamadı.");

            // Güvenlik: yalnızca üyeler grubu dinleyebilir
            var isMember = await _communityService.IsMemberAsync(userId.Value, communityId);
            if (!isMember)
                throw new HubException("Bu topluluğun üyesi değilsiniz.");

            await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(communityId));
        }

        /// <summary>Kullanıcıyı ilgili topluluğun SignalR grubundan çıkarır.</summary>
        public Task LeaveGroup(int communityId)
            => Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName(communityId));

        /// <summary>
        /// Gelen mesajı veritabanına kaydeder ve o gruptaki tüm bağlı istemcilere
        /// "ReceiveMessage" event'i ile anında (Id, Content, SentAt, SenderId, SenderName) fırlatır.
        /// </summary>
        public async Task SendMessage(int communityId, string content)
        {
            var userId = GetUserId();
            if (userId is null)
                throw new HubException("Kimlik doğrulanamadı.");

            try
            {
                // Kaydet + gönderen adını çöz (Application katmanı; üyelik kontrolü içeride yapılır)
                var message = await _communityService.SaveCommunityMessageAsync(
                    communityId, userId.Value, content);

                // Yalnızca o topluluğun grubundaki istemcilere yayınla
                await Clients.Group(GroupName(communityId))
                    .SendAsync("ReceiveMessage", message);
            }
            catch (ArgumentException ex)
            {
                throw new HubException(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                throw new HubException(ex.Message);
            }
        }

        private int? GetUserId()
        {
            var value = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(value, out var id) ? id : null;
        }
    }
}
