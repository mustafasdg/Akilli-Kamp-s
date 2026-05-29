namespace SmartCampus.Api.Models
{
    public class Announcement
    {
        public int ID { get; set; }
        public string Baslik { get; set; } = string.Empty;
        public string Icerik { get; set; } = string.Empty;
        public DateTime Tarih { get; set; }
        public string Kategori { get; set; } = string.Empty;
    }
}
