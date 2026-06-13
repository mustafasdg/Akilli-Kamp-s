namespace SmartCampus.Application.Features.Messages.Queries.GetConversations
{
    public class ConversationSummaryDto
    {
        public int PartnerId { get; set; }
        public string PartnerName { get; set; } = string.Empty;
        public string LastMessage { get; set; } = string.Empty;
        public DateTime LastMessageTime { get; set; }
        public int UnreadCount { get; set; }
    }
}
