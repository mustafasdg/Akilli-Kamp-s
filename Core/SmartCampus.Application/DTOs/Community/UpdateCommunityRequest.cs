using System.ComponentModel.DataAnnotations;

namespace SmartCampus.Application.DTOs.Community
{
    /// <summary>
    /// Admin'in mevcut bir topluluğu güncellerken gönderdiği veri.
    /// </summary>
    public class UpdateCommunityRequest
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
