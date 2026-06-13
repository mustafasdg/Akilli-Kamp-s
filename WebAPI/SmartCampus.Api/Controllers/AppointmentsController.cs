using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartCampus.Application.Features.Appointments.Commands.CreateAppointment;
using SmartCampus.Application.Features.Appointments.Commands.UpdateAppointmentStatus;
using SmartCampus.Application.Features.Appointments.Queries.GetMyAppointments;
using SmartCampus.Application.Interfaces;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AppointmentsController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IUnitOfWork _uow;

        public AppointmentsController(IMediator mediator, IUnitOfWork uow)
        {
            _mediator = mediator;
            _uow      = uow;
        }

        /// <summary>
        /// Giriş yapan kullanıcının randevularını getirir.
        /// Rol "teacher" ise öğretmene gelen randevular, aksi halde öğrencinin randevuları.
        /// GET /api/appointments/mine
        /// </summary>
        [HttpGet("mine")]
        public async Task<ActionResult<IReadOnlyList<AppointmentDto>>> GetMyAppointments(
            CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            if (userId is null) return Unauthorized();

            var role = User.FindFirstValue(ClaimTypes.Role) ?? "user";

            var appointments = await _mediator.Send(new GetMyAppointmentsQuery
            {
                UserId = userId.Value,
                Role   = role
            }, ct);

            // Öğrenci ve hoca adlarını zenginleştir
            var userIds = appointments
                .SelectMany(a => new[] { a.StudentId, a.TeacherId })
                .Distinct()
                .ToList();

            var users    = await _uow.Users.ListAsync(u => userIds.Contains(u.ID), ct);
            var userMap  = users.ToDictionary(u => u.ID);

            var result = appointments.Select(a => new AppointmentDto
            {
                Id              = a.ID,
                StudentId       = a.StudentId,
                StudentName     = userMap.TryGetValue(a.StudentId, out var s) ? s.Name : string.Empty,
                TeacherId       = a.TeacherId,
                TeacherName     = userMap.TryGetValue(a.TeacherId, out var t) ? t.Name : string.Empty,
                ScheduleId      = a.ScheduleId,
                AppointmentDate = a.AppointmentDate,
                Status          = (int)a.Status,
                Description     = a.Description,
                CreatedAt       = a.CreatedAt,
                RejectionReason = a.RejectionReason,
                SuggestedTime   = a.SuggestedTime,
            }).ToList();

            return Ok(result);
        }

        /// <summary>
        /// Yeni randevu oluşturur.
        /// POST /api/appointments
        /// Body: { teacherId, appointmentDate, description }
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<Appointment>> CreateAppointment(
            [FromBody] CreateAppointmentCommand command)
        {
            var userId = GetCurrentUserId();
            if (userId is null) return Unauthorized();

            // StudentId JWT'den alınır, body'den değil
            command.StudentId = userId.Value;

            try
            {
                var appointment = await _mediator.Send(command);
                return CreatedAtAction(nameof(GetMyAppointments), new { }, appointment);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Randevu durumunu günceller (öğretmen onaylar/reddeder).
        /// Reddederken sebep ve önerilen yeni saat verilebilir; öğrenciye bildirim oluşturulur.
        /// PUT /api/appointments/{id}/status
        /// Body: { newStatus: 1 (Approved) | 2 (Rejected), reason?, suggestedTime? }
        /// </summary>
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusRequest request)
        {
            var updated = await _mediator.Send(new UpdateAppointmentStatusCommand
            {
                AppointmentId = id,
                NewStatus     = request.NewStatus,
                Reason        = request.Reason,
                SuggestedTime = request.SuggestedTime
            });

            if (updated is null) return NotFound();
            return NoContent();
        }

        private int? GetCurrentUserId()
        {
            var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(value, out var id) ? id : null;
        }
    }

    public record UpdateStatusRequest(
        AppointmentStatus NewStatus,
        string? Reason = null,
        DateTime? SuggestedTime = null);

    public record AppointmentDto
    {
        public int      Id              { get; init; }
        public int      StudentId       { get; init; }
        public string   StudentName     { get; init; } = string.Empty;
        public int      TeacherId       { get; init; }
        public string   TeacherName     { get; init; } = string.Empty;
        public int?     ScheduleId      { get; init; }
        public DateTime AppointmentDate { get; init; }
        public int      Status          { get; init; }
        public string   Description     { get; init; } = string.Empty;
        public DateTime CreatedAt       { get; init; }
        public string?  RejectionReason { get; init; }
        public DateTime? SuggestedTime  { get; init; }
    }
}
