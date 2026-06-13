using MediatR;
using SmartCampus.Application.Features.Messages.Queries.GetConversations;
using SmartCampus.Application.Interfaces;

namespace SmartCampus.Application.Features.Messages.Queries.GetTeacherConversations
{
    public class GetTeacherConversationsQueryHandler
        : IRequestHandler<GetTeacherConversationsQuery, IReadOnlyList<ConversationSummaryDto>>
    {
        private readonly IMessageService _messageService;

        public GetTeacherConversationsQueryHandler(IMessageService messageService)
        {
            _messageService = messageService;
        }

        public Task<IReadOnlyList<ConversationSummaryDto>> Handle(
            GetTeacherConversationsQuery request,
            CancellationToken cancellationToken)
            => _messageService.GetTeacherConversationsAsync(request.TeacherId, cancellationToken);
    }
}
