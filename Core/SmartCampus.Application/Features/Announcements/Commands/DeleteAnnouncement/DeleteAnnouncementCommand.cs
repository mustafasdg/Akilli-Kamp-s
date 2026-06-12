using MediatR;

namespace SmartCampus.Application.Features.Announcements.Commands.DeleteAnnouncement
{
    /// <summary>
    /// Duyuruyu siler; silindiyse true, bulunamadiysa false doner.
    /// </summary>
    public class DeleteAnnouncementCommand : IRequest<bool>
    {
        public int Id { get; set; }

        public DeleteAnnouncementCommand() { }

        public DeleteAnnouncementCommand(int id) => Id = id;
    }
}
