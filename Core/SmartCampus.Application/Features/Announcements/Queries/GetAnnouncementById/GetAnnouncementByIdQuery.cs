using MediatR;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Features.Announcements.Queries.GetAnnouncementById
{
    /// <summary>
    /// Tek bir duyuruyu Id'ye gore getirir (bulunamazsa null).
    /// </summary>
    public class GetAnnouncementByIdQuery : IRequest<Announcement?>
    {
        public int Id { get; set; }

        public GetAnnouncementByIdQuery() { }

        public GetAnnouncementByIdQuery(int id) => Id = id;
    }
}
