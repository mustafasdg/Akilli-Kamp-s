using System.ComponentModel.DataAnnotations;

namespace SmartCampus.Domain.Entities
{
    public class User
    {
        public int ID { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(150)]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>"user", "admin" veya "teacher"</summary>
        [MaxLength(20)]
        public string Role { get; set; } = "user";

        [MaxLength(1000)]
        public string? Bio { get; set; }

        [MaxLength(200)]
        public string? OfficeLocation { get; set; }

        [MaxLength(500)]
        public string? ResearchAreas { get; set; }

        /// <summary>Öğretim üyesinin oda numarası (yalnızca teacher rolünde dolu).</summary>
        [MaxLength(50)]
        public string? RoomNumber { get; set; }

        /// <summary>Öğretim üyesinin uzmanlık alanı (yalnızca teacher rolünde dolu).</summary>
        [MaxLength(150)]
        public string? Specialty { get; set; }
    }
}
