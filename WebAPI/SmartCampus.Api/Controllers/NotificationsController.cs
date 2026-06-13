using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartCampus.Application.Features.Notifications.Commands.MarkNotificationRead;
using SmartCampus.Application.Features.Notifications.Queries.GetMyNotifications;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public NotificationsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        /// <summary>
        /// Giriş yapan kullanıcının bildirimlerini (en yeniden eskiye) getirir.
        /// GET /api/notifications/mine
        /// </summary>
        [HttpGet("mine")]
        public async Task<ActionResult<IReadOnlyList<NotificationDto>>> GetMyNotifications(
            CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            if (userId is null) return Unauthorized();

            var notifications = await _mediator.Send(
                new GetMyNotificationsQuery { UserId = userId.Value }, ct);

            var result = notifications.Select(n => new NotificationDto
            {
                Id            = n.ID,
                Title         = n.Title,
                Body          = n.Body,
                AppointmentId = n.AppointmentId,
                IsRead        = n.IsRead,
                CreatedAt     = n.CreatedAt,
            }).ToList();

            return Ok(result);
        }

        /// <summary>
        /// Bildirimi okundu olarak işaretler (sadece kendi bildirimi).
        /// PUT /api/notifications/{id}/read
        /// </summary>
        [HttpPut("{id:int}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var userId = GetCurrentUserId();
            if (userId is null) return Unauthorized();

            var ok = await _mediator.Send(new MarkNotificationReadCommand
            {
                NotificationId = id,
                UserId         = userId.Value
            });

            if (!ok) return NotFound();
            return NoContent();
        }

        private int? GetCurrentUserId()
        {
            var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(value, out var id) ? id : null;
        }
    }

    public record NotificationDto
    {
        public int      Id            { get; init; }
        public string   Title         { get; init; } = string.Empty;
        public string   Body          { get; init; } = string.Empty;
        public int?     AppointmentId { get; init; }
        public bool     IsRead        { get; init; }
        public DateTime CreatedAt     { get; init; }
    }
}
