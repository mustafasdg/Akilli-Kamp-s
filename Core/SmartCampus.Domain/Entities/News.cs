namespace SmartCampus.Domain.Entities
{
    public class News
    {
        public int ID { get; set; }
        public string Baslik { get; set; } = string.Empty;
        public string Icerik { get; set; } = string.Empty;
        public DateTime Tarih { get; set; }
        public string Kategori { get; set; } = "Genel";

        // Haberi olusturan admin (opsiyonel)
        public int? AppUserId { get; set; }
        public User? AppUser { get; set; }
    }
}
