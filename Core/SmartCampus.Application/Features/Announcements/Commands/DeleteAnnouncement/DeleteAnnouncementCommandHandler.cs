using MediatR;
using SmartCampus.Application.Interfaces;

namespace SmartCampus.Application.Features.Announcements.Commands.DeleteAnnouncement
{
    public class DeleteAnnouncementCommandHandler
        : IRequestHandler<DeleteAnnouncementCommand, bool>
    {
        private readonly IUnitOfWork _uow;

        public DeleteAnnouncementCommandHandler(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<bool> Handle(DeleteAnnouncementCommand request, CancellationToken cancellationToken)
        {
            var announcement = await _uow.Announcements.GetByIdAsync(request.Id, cancellationToken);
            if (announcement is null)
            {
                return false;
            }

            _uow.Announcements.Remove(announcement);
            await _uow.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}
