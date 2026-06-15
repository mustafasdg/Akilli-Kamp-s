namespace SmartCampus.Application.DTOs.Menu
{
    public class MenuItemDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int Calories { get; set; }
    }
}
