using MediatR;
using SmartCampus.Application.Interfaces;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Features.Messages.Commands.SendMessage
{
    public class SendMessageCommandHandler : IRequestHandler<SendMessageCommand, Message>
    {
        private readonly IMessageService _messageService;

        public SendMessageCommandHandler(IMessageService messageService)
        {
            _messageService = messageService;
        }

        public Task<Message> Handle(SendMessageCommand request, CancellationToken cancellationToken)
            => _messageService.SendMessageAsync(
                request.SenderId,
                request.ReceiverId,
                request.Content,
                cancellationToken);
    }
}
