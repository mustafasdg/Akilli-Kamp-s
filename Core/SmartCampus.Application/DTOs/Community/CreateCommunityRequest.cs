using System.ComponentModel.DataAnnotations;

namespace SmartCampus.Application.DTOs.Community
{
    /// <summary>
    /// Admin'in yeni bir topluluk oluştururken gönderdiği veri.
    /// </summary>
    public class CreateCommunityRequest
    {
        [Required]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;

        /// <summary>Topluluk kapak görseli (opsiyonel).</summary>
        [MaxLength(500)]
        public string? ImageUrl { get; set; }
    }
}
