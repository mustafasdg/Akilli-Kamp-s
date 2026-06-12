namespace SmartCampus.Domain.Entities
{
    public class Menu
    {
        public int ID { get; set; }
        public DateTime Tarih { get; set; }
        public string Yemek_1 { get; set; } = string.Empty;
        public string Yemek_2 { get; set; } = string.Empty;
        public string Yemek_3 { get; set; } = string.Empty;
        public string Yemek_4 { get; set; } = string.Empty;
        public int Kalori { get; set; }
    }
}
