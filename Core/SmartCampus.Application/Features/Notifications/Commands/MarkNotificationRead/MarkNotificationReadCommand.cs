using MediatR;

namespace SmartCampus.Application.Features.Notifications.Commands.MarkNotificationRead
{
    public class MarkNotificationReadCommand : IRequest<bool>
    {
        public int NotificationId { get; set; }

        // Controller JWT'den doldurur — sadece kendi bildirimini okundu yapabilir
        public int UserId { get; set; }
    }
}
