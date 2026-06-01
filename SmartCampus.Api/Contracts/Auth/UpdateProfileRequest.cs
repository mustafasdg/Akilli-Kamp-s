using System.ComponentModel.DataAnnotations;

namespace SmartCampus.Api.Contracts.Auth
{
    public class UpdateProfileRequest
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
    }
}
