using System.ComponentModel.DataAnnotations;
using MediatR;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Features.Announcements.Commands.CreateAnnouncement
{
    /// <summary>
    /// Yeni duyuru olusturur ve olusturulan entity'yi doner.
    /// </summary>
    public class CreateAnnouncementCommand : IRequest<Announcement>
    {
        [Required, MaxLength(300)]
        public string Baslik { get; set; } = string.Empty;

        [Required]
        public string Icerik { get; set; } = string.Empty;

        [Required, MaxLength(50)]
        public string Kategori { get; set; } = string.Empty;
    }
}
