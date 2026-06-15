namespace SmartCampus.Domain.Entities
{
    /// <summary>
    /// Öğrencilerin etkinlik, kulüp veya staj gibi konularda bir araya geldiği topluluk.
    /// Topluluklar admin tarafından oluşturulur, öğrenciler "Keşfet" listesinden katılır.
    /// </summary>
    public class Community
    {
        public int ID { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        /// <summary>Topluluk kapak görseli (opsiyonel).</summary>
        public string? ImageUrl { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
