using MediatR;
using SmartCampus.Application.DTOs.Common;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Features.Announcements.Queries.GetAllAnnouncements
{
    /// <summary>
    /// Duyurulari tarihe gore azalan ve sayfalamali olarak getirir.
    /// </summary>
    public class GetAllAnnouncementsQuery : IRequest<PagedResponse<Announcement>>
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}
