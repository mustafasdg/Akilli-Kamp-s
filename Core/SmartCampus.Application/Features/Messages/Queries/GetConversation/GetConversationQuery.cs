using MediatR;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Features.Messages.Queries.GetConversation
{
    public class GetConversationQuery : IRequest<IReadOnlyList<Message>>
    {
        public int UserId1 { get; set; }
        public int UserId2 { get; set; }
    }
}
