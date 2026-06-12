using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartCampus.Application.DTOs.Common;
using SmartCampus.Application.Features.Announcements.Commands.CreateAnnouncement;
using SmartCampus.Application.Features.Announcements.Commands.DeleteAnnouncement;
using SmartCampus.Application.Features.Announcements.Commands.UpdateAnnouncement;
using SmartCampus.Application.Features.Announcements.Queries.GetAllAnnouncements;
using SmartCampus.Application.Features.Announcements.Queries.GetAnnouncementById;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AnnouncementsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public AnnouncementsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<PagedResponse<Announcement>>> GetAnnouncements([FromQuery] PaginationQuery query)
        {
            var result = await _mediator.Send(new GetAllAnnouncementsQuery
            {
                Page = query.Page,
                PageSize = query.PageSize
            });

            return Ok(result);
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<Announcement>> GetAnnouncement(int id)
        {
            var announcement = await _mediator.Send(new GetAnnouncementByIdQuery(id));

            if (announcement == null)
            {
                return NotFound();
            }

            return announcement;
        }

        [HttpPost]
        public async Task<ActionResult<Announcement>> PostAnnouncement(CreateAnnouncementCommand command)
        {
            var announcement = await _mediator.Send(command);

            return CreatedAtAction(nameof(GetAnnouncement), new { id = announcement.ID }, announcement);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutAnnouncement(int id, UpdateAnnouncementCommand command)
        {
            command.Id = id;
            var updated = await _mediator.Send(command);

            if (updated == null)
            {
                return NotFound();
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAnnouncement(int id)
        {
            var deleted = await _mediator.Send(new DeleteAnnouncementCommand(id));

            if (!deleted)
            {
                return NotFound();
            }

            return NoContent();
        }
    }
}
