using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartCampus.Application.DTOs.Common;
using SmartCampus.Application.Interfaces;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class EventsController : ControllerBase
    {
        private readonly IUnitOfWork _uow;

        public EventsController(IUnitOfWork uow)
        {
            _uow = uow;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<PagedResponse<Event>>> GetEvents([FromQuery] PaginationQuery query)
        {
            var totalCount = await _uow.Events.CountAsync();
            var items = await _uow.Events.GetPagedAsync(query.Skip, query.PageSize, e => e.Tarih, descending: true);

            return Ok(PagedResponse<Event>.Create(items.ToList(), query.SafePage, query.PageSize, totalCount));
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<Event>> GetEvent(int id)
        {
            var eventItem = await _uow.Events.GetByIdAsync(id);

            if (eventItem == null)
            {
                return NotFound();
            }

            return eventItem;
        }

        [HttpPost]
        public async Task<ActionResult<Event>> PostEvent(Event eventItem)
        {
            await _uow.Events.AddAsync(eventItem);
            await _uow.SaveChangesAsync();

            return CreatedAtAction(nameof(GetEvent), new { id = eventItem.ID }, eventItem);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutEvent(int id, Event eventItem)
        {
            if (id != eventItem.ID)
            {
                return BadRequest();
            }

            _uow.Events.Update(eventItem);

            try
            {
                await _uow.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await EventExists(id))
                {
                    return NotFound();
                }

                throw;
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEvent(int id)
        {
            var eventItem = await _uow.Events.GetByIdAsync(id);
            if (eventItem == null)
            {
                return NotFound();
            }

            _uow.Events.Remove(eventItem);
            await _uow.SaveChangesAsync();

            return NoContent();
        }

        private Task<bool> EventExists(int id)
            => _uow.Events.AnyAsync(e => e.ID == id);
    }
}
