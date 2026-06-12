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
    public class LocationsController : ControllerBase
    {
        private readonly IUnitOfWork _uow;

        public LocationsController(IUnitOfWork uow)
        {
            _uow = uow;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<PagedResponse<Location>>> GetLocations([FromQuery] PaginationQuery query)
        {
            var totalCount = await _uow.Locations.CountAsync();
            var items = await _uow.Locations.GetPagedAsync(query.Skip, query.PageSize, l => l.Bina_Adi, descending: false);

            return Ok(PagedResponse<Location>.Create(items.ToList(), query.SafePage, query.PageSize, totalCount));
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<Location>> GetLocation(int id)
        {
            var location = await _uow.Locations.GetByIdAsync(id);

            if (location == null)
            {
                return NotFound();
            }

            return location;
        }

        [HttpPost]
        public async Task<ActionResult<Location>> PostLocation(Location location)
        {
            await _uow.Locations.AddAsync(location);
            await _uow.SaveChangesAsync();

            return CreatedAtAction(nameof(GetLocation), new { id = location.ID }, location);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutLocation(int id, Location location)
        {
            if (id != location.ID)
            {
                return BadRequest();
            }

            _uow.Locations.Update(location);

            try
            {
                await _uow.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await LocationExists(id))
                {
                    return NotFound();
                }

                throw;
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLocation(int id)
        {
            var location = await _uow.Locations.GetByIdAsync(id);
            if (location == null)
            {
                return NotFound();
            }

            _uow.Locations.Remove(location);
            await _uow.SaveChangesAsync();

            return NoContent();
        }

        private Task<bool> LocationExists(int id)
            => _uow.Locations.AnyAsync(e => e.ID == id);
    }
}
