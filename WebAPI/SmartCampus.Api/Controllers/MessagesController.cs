using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartCampus.Application.Features.Messages.Commands.MarkAsRead;
using SmartCampus.Application.Features.Messages.Commands.SendMessage;
using SmartCampus.Application.Features.Messages.Queries.GetConversation;
using SmartCampus.Application.Features.Messages.Queries.GetConversations;
using SmartCampus.Application.Features.Messages.Queries.GetTeacherConversations;
using SmartCampus.Domain.Entities;
using MessageDto = SmartCampus.Application.Features.Messages.Queries.GetConversation.MessageDto;

namespace SmartCampus.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MessagesController : ControllerBase
    {
        private readonly IMediator _mediator;

        public MessagesController(IMediator mediator)
        {
            _mediator = mediator;
        }

        /// <summary>
        /// Giriş yapan kullanıcının tüm aktif konuşmalarını (son mesaj + okunmamış sayısı) getirir.
        /// GET /api/messages/conversations
        /// </summary>
        [HttpGet("conversations")]
        public async Task<ActionResult<IReadOnlyList<ConversationSummaryDto>>> GetConversations()
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId is null) return Unauthorized();

            var result = await _mediator.Send(new GetConversationsQuery { UserId = currentUserId.Value });
            return Ok(result);
        }

        /// <summary>
        /// Öğretmenin randevu almış veya mesajlaşmış tüm öğrencilerini getirir.
        /// GET /api/messages/teacher/conversations
        /// </summary>
        [HttpGet("teacher/conversations")]
        public async Task<ActionResult<IReadOnlyList<ConversationSummaryDto>>> GetTeacherConversations()
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId is null) return Unauthorized();

            var result = await _mediator.Send(
                new GetTeacherConversationsQuery { TeacherId = currentUserId.Value });
            return Ok(result);
        }

        /// <summary>
        /// Giriş yapan kullanıcı ile belirtilen kullanıcı arasındaki
        /// konuşmayı kronolojik sırayla getirir.
        /// GET /api/messages/conversation/{otherUserId}
        /// </summary>
        [HttpGet("conversation/{otherUserId:int}")]
        public async Task<ActionResult<IReadOnlyList<MessageDto>>> GetConversation(int otherUserId)
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId is null) return Unauthorized();

            var messages = await _mediator.Send(new GetConversationQuery
            {
                UserId1 = currentUserId.Value,
                UserId2 = otherUserId
            });

            return Ok(messages);
        }

        /// <summary>
        /// Mesaj gönderir.
        /// POST /api/messages
        /// Body: { receiverId, content }
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<Message>> SendMessage([FromBody] SendMessageCommand command)
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId is null) return Unauthorized();

            command.SenderId = currentUserId.Value;

            try
            {
                var message = await _mediator.Send(command);
                return CreatedAtAction(
                    nameof(GetConversation),
                    new { otherUserId = message.ReceiverId },
                    message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Belirtilen kullanıcıdan gelen okunmamış mesajları okundu işaretler.
        /// PUT /api/messages/read/{senderId}
        /// Dönen değer: okundu işaretlenen mesaj sayısı.
        /// </summary>
        [HttpPut("read/{senderId:int}")]
        public async Task<ActionResult<int>> MarkAsRead(int senderId)
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId is null) return Unauthorized();

            var count = await _mediator.Send(new MarkAsReadCommand
            {
                ReceiverId = currentUserId.Value,
                SenderId = senderId
            });

            return Ok(new { markedAsRead = count });
        }

        private int? GetCurrentUserId()
        {
            var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(value, out var id) ? id : null;
        }
    }
}
