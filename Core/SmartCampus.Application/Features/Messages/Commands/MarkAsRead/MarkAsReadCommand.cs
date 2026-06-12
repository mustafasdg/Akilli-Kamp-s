using MediatR;

namespace SmartCampus.Application.Features.Messages.Commands.MarkAsRead
{
    public class MarkAsReadCommand : IRequest<int>
    {
        // Controller JWT'den doldurur (mesajları okuyan kişi)
        public int ReceiverId { get; set; }

        // Hangi gönderenin mesajları okunacak
        public int SenderId { get; set; }
    }
}
