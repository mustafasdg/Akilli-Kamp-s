using MediatR;
using SmartCampus.Application.Interfaces;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Features.Notifications.Queries.GetMyNotifications
{
    public class GetMyNotificationsQueryHandler
        : IRequestHandler<GetMyNotificationsQuery, IReadOnlyList<Notification>>
    {
        private readonly IUnitOfWork _uow;

        public GetMyNotificationsQueryHandler(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<IReadOnlyList<Notification>> Handle(
            GetMyNotificationsQuery request,
            CancellationToken cancellationToken)
        {
            var notifications = await _uow.Notifications.ListAsync(
                n => n.UserId == request.UserId, cancellationToken);

            return notifications
                .OrderByDescending(n => n.CreatedAt)
                .ToList();
        }
    }
}
