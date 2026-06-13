using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartCampus.Application.Features.Appointments.Queries.GetAvailableSlots;
using SmartCampus.Application.Features.Schedules.Commands.CreateSchedule;
using SmartCampus.Application.Features.Schedules.Commands.DeleteSchedule;
using SmartCampus.Application.Features.Schedules.Commands.MarkAsEkDers;
using SmartCampus.Application.Features.Schedules.Commands.ResetSlot;
using SmartCampus.Application.Features.Schedules.Commands.UpdateSchedule;
using SmartCampus.Application.Features.Schedules.Queries.GetTeacherSchedules;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SchedulesController : ControllerBase
    {
        private readonly IMediator _mediator;

        public SchedulesController(IMediator mediator)
        {
            _mediator = mediator;
        }

        /// <summary>
        /// Belirtilen öğretmenin müsaitlik programını getirir.
        /// GET /api/schedules/{teacherId}
        /// </summary>
        [HttpGet("{teacherId:int}")]
        [AllowAnonymous]
        public async Task<ActionResult<IReadOnlyList<TeacherSchedule>>> GetTeacherSchedules(int teacherId)
        {
            var result = await _mediator.Send(new GetTeacherSchedulesQuery { TeacherId = teacherId });
            return Ok(result);
        }

        /// <summary>
        /// Öğretmenin yalnızca boş (aktif randevu talebi olmayan) slotlarını getirir.
        /// Doluluk Appointment tablosundaki Pending/Approved kayıtlardan hesaplanır.
        /// GET /api/schedules/{teacherId}/available?date=2026-06-15
        /// </summary>
        [HttpGet("{teacherId:int}/available")]
        [AllowAnonymous]
        public async Task<ActionResult<IReadOnlyList<TeacherSchedule>>> GetAvailableSlots(
            int teacherId, [FromQuery] DateTime? date)
        {
            var result = await _mediator.Send(new GetAvailableSlotsQuery
            {
                TeacherId = teacherId,
                Date      = date
            });
            return Ok(result);
        }

        /// <summary>
        /// Giriş yapan öğretmenin yeni müsaitlik bloğu oluşturur.
        /// POST /api/schedules
        /// Body: { dayOfWeek, startTime, endTime }
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<TeacherSchedule>> CreateSchedule(
            [FromBody] CreateScheduleCommand command)
        {
            var userId = GetCurrentUserId();
            if (userId is null) return Unauthorized();

            // TeacherId JWT'den alınır
            command.TeacherId = userId.Value;

            try
            {
                var schedule = await _mediator.Send(command);
                return CreatedAtAction(
                    nameof(GetTeacherSchedules),
                    new { teacherId = schedule.TeacherId },
                    schedule);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Giriş yapan öğretmenin kendi slotunu günceller (gün, saat, müsaitlik).
        /// PUT /api/schedules/{id}
        /// Body: { dayOfWeek, startTime, endTime, isAvailable }
        /// </summary>
        [HttpPut("{id:int}")]
        public async Task<ActionResult<TeacherSchedule>> UpdateSchedule(
            int id, [FromBody] UpdateScheduleCommand command)
        {
            var userId = GetCurrentUserId();
            if (userId is null) return Unauthorized();

            command.ScheduleId = id;
            command.TeacherId  = userId.Value;

            try
            {
                var updated = await _mediator.Send(command);
                if (updated is null) return NotFound();
                return Ok(updated);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Slotlar artık veritabanından silinmez — yalnızca EkDers/Müsait arasında güncellenir.
        /// DELETE /api/schedules/{id} → 405 Method Not Allowed
        /// </summary>
        [HttpDelete("{id:int}")]
        public IActionResult DeleteSchedule(int id)
            => StatusCode(405, new { message = "Slotlar silinemez. EkDers eklemek için PUT /{id}/ekders, Müsait'e döndürmek için PUT /{id}/reset kullanın." });

        /// <summary>
        /// Müsait slotu EkDers olarak işaretler (güncelleme, silme yok).
        /// PUT /api/schedules/{id}/ekders
        /// Body: { courseName, classLocation? }
        /// </summary>
        [HttpPut("{id:int}/ekders")]
        public async Task<ActionResult<TeacherSchedule>> MarkAsEkDers(
            int id, [FromBody] MarkAsEkDersCommand command)
        {
            var userId = GetCurrentUserId();
            if (userId is null) return Unauthorized();

            command.ScheduleId = id;
            command.TeacherId  = userId.Value;

            try
            {
                var slot = await _mediator.Send(command);
                return Ok(slot);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// EkDers slotunu Müsait'e sıfırlar (CourseName/ClassLocation temizlenir, IsAvailable=true).
        /// PUT /api/schedules/{id}/reset
        /// </summary>
        [HttpPut("{id:int}/reset")]
        public async Task<ActionResult<TeacherSchedule>> ResetSlot(int id)
        {
            var userId = GetCurrentUserId();
            if (userId is null) return Unauthorized();

            try
            {
                var slot = await _mediator.Send(new ResetSlotCommand
                {
                    ScheduleId = id,
                    TeacherId  = userId.Value,
                });

                if (slot is null) return NotFound();
                return Ok(slot);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        private int? GetCurrentUserId()
        {
            var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(value, out var id) ? id : null;
        }
    }
}
