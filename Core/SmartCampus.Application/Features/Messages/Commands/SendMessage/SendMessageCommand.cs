using System.ComponentModel.DataAnnotations;
using MediatR;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Features.Messages.Commands.SendMessage
{
    public class SendMessageCommand : IRequest<Message>
    {
        // Controller JWT'den doldurur
        public int SenderId { get; set; }

        [Required]
        public int ReceiverId { get; set; }

        [Required, MaxLength(2000)]
        public string Content { get; set; } = string.Empty;
    }
}
