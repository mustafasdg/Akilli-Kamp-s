using MediatR;
using SmartCampus.Application.Interfaces;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Features.Messages.Queries.GetConversation
{
    public class GetConversationQueryHandler
        : IRequestHandler<GetConversationQuery, IReadOnlyList<Message>>
    {
        private readonly IMessageService _messageService;

        public GetConversationQueryHandler(IMessageService messageService)
        {
            _messageService = messageService;
        }

        public Task<IReadOnlyList<Message>> Handle(
            GetConversationQuery request,
            CancellationToken cancellationToken)
            => _messageService.GetConversationAsync(
                request.UserId1,
                request.UserId2,
                cancellationToken);
    }
}
