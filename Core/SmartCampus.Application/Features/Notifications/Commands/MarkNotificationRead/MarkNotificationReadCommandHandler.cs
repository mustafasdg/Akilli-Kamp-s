using MediatR;
using SmartCampus.Application.Interfaces;

namespace SmartCampus.Application.Features.Notifications.Commands.MarkNotificationRead
{
    public class MarkNotificationReadCommandHandler
        : IRequestHandler<MarkNotificationReadCommand, bool>
    {
        private readonly IUnitOfWork _uow;

        public MarkNotificationReadCommandHandler(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<bool> Handle(
            MarkNotificationReadCommand request,
            CancellationToken cancellationToken)
        {
            var notification = await _uow.Notifications.GetByIdAsync(
                request.NotificationId, cancellationToken);

            if (notification is null || notification.UserId != request.UserId)
                return false;

            if (!notification.IsRead)
            {
                notification.IsRead = true;
                _uow.Notifications.Update(notification);
                await _uow.SaveChangesAsync(cancellationToken);
            }

            return true;
        }
    }
}
