namespace SmartCampus.Api.Models
{
    public class Location
    {
        public int ID { get; set; }
        public string Bina_Adi { get; set; } = string.Empty;
        public double Enlem { get; set; }
        public double Boylam { get; set; }
        public string Aciklama { get; set; } = string.Empty;
    }
}
