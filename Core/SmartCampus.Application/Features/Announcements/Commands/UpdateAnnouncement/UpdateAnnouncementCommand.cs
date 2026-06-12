using System.ComponentModel.DataAnnotations;
using MediatR;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Features.Announcements.Commands.UpdateAnnouncement
{
    /// <summary>
    /// Var olan duyuruyu gunceller; bulunamazsa null doner.
    /// </summary>
    public class UpdateAnnouncementCommand : IRequest<Announcement?>
    {
        public int Id { get; set; }

        [Required, MaxLength(300)]
        public string Baslik { get; set; } = string.Empty;

        [Required]
        public string Icerik { get; set; } = string.Empty;

        [Required, MaxLength(50)]
        public string Kategori { get; set; } = string.Empty;
    }
}
