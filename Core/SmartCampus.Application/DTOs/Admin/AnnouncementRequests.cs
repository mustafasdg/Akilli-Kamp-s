using System.ComponentModel.DataAnnotations;

namespace SmartCampus.Application.DTOs.Admin
{
    public class CreateAnnouncementRequest
    {
        [Required, MaxLength(300)]
        public string Baslik { get; set; } = string.Empty;

        [Required]
        public string Icerik { get; set; } = string.Empty;

        [Required, MaxLength(50)]
        public string Kategori { get; set; } = string.Empty;
    }

    public class UpdateAnnouncementRequest
    {
        [Required, MaxLength(300)]
        public string Baslik { get; set; } = string.Empty;

        [Required]
        public string Icerik { get; set; } = string.Empty;

        [Required, MaxLength(50)]
        public string Kategori { get; set; } = string.Empty;
    }
}
