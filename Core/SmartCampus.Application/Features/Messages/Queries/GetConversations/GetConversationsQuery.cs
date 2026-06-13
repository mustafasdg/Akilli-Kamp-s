using MediatR;

namespace SmartCampus.Application.Features.Messages.Queries.GetConversations
{
    public class GetConversationsQuery : IRequest<IReadOnlyList<ConversationSummaryDto>>
    {
        public int UserId { get; set; }
    }
}
