namespace SmartCampus.Application.DTOs.Menu
{
    public class DailyMenuDto
    {
        public int Id { get; set; }
        public DateTime Date { get; set; }
        public int TotalCalories { get; set; }
        public List<MenuItemDto> Items { get; set; } = new();

        /// <summary>Yemekhane o gün kapalıysa (hafta sonu/tatil) true.</summary>
        public bool IsClosed { get; set; }

        /// <summary>Kapalıysa kullanıcıya gösterilecek açıklama; açıkken null.</summary>
        public string? ClosingMessage { get; set; }
    }
}
