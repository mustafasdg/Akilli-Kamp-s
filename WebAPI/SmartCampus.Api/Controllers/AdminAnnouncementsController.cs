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
    [Route("api/admin/announcements")]
    [ApiController]
    [Authorize(Roles = "admin")]
    public class AdminAnnouncementsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public AdminAnnouncementsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        // GET /api/admin/announcements
        [HttpGet]
        public async Task<ActionResult<PagedResponse<Announcement>>> GetAll([FromQuery] PaginationQuery query)
        {
            var result = await _mediator.Send(new GetAllAnnouncementsQuery
            {
                Page = query.Page,
                PageSize = query.PageSize
            });

            return Ok(result);
        }

        // GET /api/admin/announcements/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Announcement>> GetById(int id)
        {
            var item = await _mediator.Send(new GetAnnouncementByIdQuery(id));
            if (item == null) return NotFound(new { message = "Duyuru bulunamadı." });
            return Ok(item);
        }

        // POST /api/admin/announcements
        [HttpPost]
        public async Task<ActionResult<Announcement>> Create(CreateAnnouncementCommand command)
        {
            var item = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetById), new { id = item.ID }, item);
        }

        // PUT /api/admin/announcements/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<Announcement>> Update(int id, UpdateAnnouncementCommand command)
        {
            command.Id = id;
            var item = await _mediator.Send(command);
            if (item == null) return NotFound(new { message = "Duyuru bulunamadı." });
            return Ok(item);
        }

        // DELETE /api/admin/announcements/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _mediator.Send(new DeleteAnnouncementCommand(id));
            if (!deleted) return NotFound(new { message = "Duyuru bulunamadı." });
            return Ok(new { message = "Duyuru silindi." });
        }
    }
}
