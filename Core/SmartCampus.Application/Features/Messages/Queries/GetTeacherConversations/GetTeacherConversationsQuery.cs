using MediatR;
using SmartCampus.Application.Features.Messages.Queries.GetConversations;

namespace SmartCampus.Application.Features.Messages.Queries.GetTeacherConversations
{
    public class GetTeacherConversationsQuery : IRequest<IReadOnlyList<ConversationSummaryDto>>
    {
        public int TeacherId { get; set; }
    }
}
