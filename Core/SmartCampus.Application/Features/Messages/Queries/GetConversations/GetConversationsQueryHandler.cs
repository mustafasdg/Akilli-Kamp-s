using MediatR;
using SmartCampus.Application.Interfaces;

namespace SmartCampus.Application.Features.Messages.Queries.GetConversations
{
    public class GetConversationsQueryHandler
        : IRequestHandler<GetConversationsQuery, IReadOnlyList<ConversationSummaryDto>>
    {
        private readonly IMessageService _messageService;

        public GetConversationsQueryHandler(IMessageService messageService)
        {
            _messageService = messageService;
        }

        public Task<IReadOnlyList<ConversationSummaryDto>> Handle(
            GetConversationsQuery request,
            CancellationToken cancellationToken)
            => _messageService.GetConversationsAsync(request.UserId, cancellationToken);
    }
}
