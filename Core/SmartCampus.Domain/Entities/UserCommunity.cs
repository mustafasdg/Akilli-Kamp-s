namespace SmartCampus.Domain.Entities
{
    /// <summary>
    /// Öğrenci ile Topluluk arasındaki Many-to-Many ara (join) tablosu.
    /// Birincil anahtar (UserId, CommunityId) ikilisidir; böylece bir kullanıcı
    /// aynı topluluğa yalnızca bir kez üye olabilir (veritabanı seviyesinde garanti).
    /// </summary>
    public class UserCommunity
    {
        public int UserId { get; set; }
        public User? User { get; set; }

        public int CommunityId { get; set; }
        public Community? Community { get; set; }

        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    }
}
