namespace SmartCampus.Domain.Entities
{
    /// <summary>
    /// Bir topluluk içindeki sohbet mesajı.
    /// Not: Chat akışı (SignalR) bu aşamada kurulmuyor; entity ileride
    /// kullanılmak üzere şemada hazır tutulur.
    /// </summary>
    public class CommunityMessage
    {
        public int ID { get; set; }

        public int CommunityId { get; set; }
        public Community? Community { get; set; }

        /// <summary>Mesajı gönderen kullanıcı.</summary>
        public int UserId { get; set; }
        public User? User { get; set; }

        public string Content { get; set; } = string.Empty;

        public DateTime SentAt { get; set; } = DateTime.UtcNow;
    }
}
