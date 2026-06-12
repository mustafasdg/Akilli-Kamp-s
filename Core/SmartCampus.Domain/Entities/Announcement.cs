namespace SmartCampus.Domain.Entities
{
    public class Announcement
    {
        public int ID { get; set; }
        public string Baslik { get; set; } = string.Empty;
        public string Icerik { get; set; } = string.Empty;
        public DateTime Tarih { get; set; }
        public string Kategori { get; set; } = string.Empty;

        // Duyuruyu olusturan admin (opsiyonel)
        public int? AppUserId { get; set; }
        public User? AppUser { get; set; }

        // Duyurunun ilgili oldugu konum (opsiyonel)
        public int? LocationId { get; set; }
        public Location? Location { get; set; }
    }
}
