using MediatR;
using SmartCampus.Application.Interfaces;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Features.Announcements.Queries.GetAnnouncementById
{
    public class GetAnnouncementByIdQueryHandler
        : IRequestHandler<GetAnnouncementByIdQuery, Announcement?>
    {
        private readonly IUnitOfWork _uow;

        public GetAnnouncementByIdQueryHandler(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public Task<Announcement?> Handle(GetAnnouncementByIdQuery request, CancellationToken cancellationToken)
            => _uow.Announcements.GetByIdAsync(request.Id, cancellationToken);
    }
}
