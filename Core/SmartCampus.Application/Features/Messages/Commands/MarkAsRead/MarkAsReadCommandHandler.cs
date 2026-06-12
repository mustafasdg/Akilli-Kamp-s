using MediatR;
using SmartCampus.Application.Interfaces;

namespace SmartCampus.Application.Features.Messages.Commands.MarkAsRead
{
    public class MarkAsReadCommandHandler : IRequestHandler<MarkAsReadCommand, int>
    {
        private readonly IMessageService _messageService;

        public MarkAsReadCommandHandler(IMessageService messageService)
        {
            _messageService = messageService;
        }

        public Task<int> Handle(MarkAsReadCommand request, CancellationToken cancellationToken)
            => _messageService.MarkAsReadAsync(
                request.ReceiverId,
                request.SenderId,
                cancellationToken);
    }
}
