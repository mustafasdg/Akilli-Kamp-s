using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartCampus.Application.Features.Schedules.Commands.CreateSchedule;
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

        private int? GetCurrentUserId()
        {
            var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(value, out var id) ? id : null;
        }
    }
}
