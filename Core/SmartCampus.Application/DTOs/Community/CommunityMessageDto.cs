namespace SmartCampus.Application.DTOs.Community
{
    /// <summary>
    /// Bir topluluk sohbet mesajının istemciye dönen biçimi.
    /// Hem REST geçmiş endpoint'i hem de SignalR "ReceiveMessage" event'i bu DTO'yu kullanır.
    /// </summary>
    public class CommunityMessageDto
    {
        public int Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime SentAt { get; set; }
        public int SenderId { get; set; }
        public string SenderName { get; set; } = string.Empty;
    }
}
