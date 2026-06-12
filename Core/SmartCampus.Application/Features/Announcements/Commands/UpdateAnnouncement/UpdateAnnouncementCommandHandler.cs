using MediatR;
using SmartCampus.Application.Interfaces;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Features.Announcements.Commands.UpdateAnnouncement
{
    public class UpdateAnnouncementCommandHandler
        : IRequestHandler<UpdateAnnouncementCommand, Announcement?>
    {
        private readonly IUnitOfWork _uow;

        public UpdateAnnouncementCommandHandler(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<Announcement?> Handle(UpdateAnnouncementCommand request, CancellationToken cancellationToken)
        {
            var announcement = await _uow.Announcements.GetByIdAsync(request.Id, cancellationToken);
            if (announcement is null)
            {
                return null;
            }

            announcement.Baslik = request.Baslik.Trim();
            announcement.Icerik = request.Icerik.Trim();
            announcement.Kategori = request.Kategori.Trim();

            await _uow.SaveChangesAsync(cancellationToken);
            return announcement;
        }
    }
}
