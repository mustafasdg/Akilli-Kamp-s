using System.ComponentModel.DataAnnotations;

namespace SmartCampus.Application.DTOs.Auth
{
    public class LoginRequest
    {
        [Required]
        [EmailAddress]
        [MaxLength(150)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        [MaxLength(128)]
        public string Password { get; set; } = string.Empty;
    }
}
