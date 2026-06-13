using MediatR;

namespace SmartCampus.Application.Features.Messages.Queries.GetConversation
{
    public class GetConversationQuery : IRequest<IReadOnlyList<MessageDto>>
    {
        public int UserId1 { get; set; }
        public int UserId2 { get; set; }
    }
}
