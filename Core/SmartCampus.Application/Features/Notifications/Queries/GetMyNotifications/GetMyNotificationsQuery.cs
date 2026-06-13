using MediatR;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Features.Notifications.Queries.GetMyNotifications
{
    public class GetMyNotificationsQuery : IRequest<IReadOnlyList<Notification>>
    {
        public int UserId { get; set; }
    }
}
