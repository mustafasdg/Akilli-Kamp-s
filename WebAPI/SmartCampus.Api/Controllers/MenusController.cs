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
    public class MenusController : ControllerBase
    {
        private readonly IUnitOfWork _uow;

        public MenusController(IUnitOfWork uow)
        {
            _uow = uow;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<PagedResponse<Menu>>> GetMenus([FromQuery] PaginationQuery query)
        {
            var totalCount = await _uow.Menus.CountAsync();
            var items = await _uow.Menus.GetPagedAsync(query.Skip, query.PageSize, m => m.Tarih, descending: false);

            return Ok(PagedResponse<Menu>.Create(items.ToList(), query.SafePage, query.PageSize, totalCount));
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<Menu>> GetMenu(int id)
        {
            var menu = await _uow.Menus.GetByIdAsync(id);

            if (menu == null)
            {
                return NotFound();
            }

            return menu;
        }

        [HttpPost]
        public async Task<ActionResult<Menu>> PostMenu(Menu menu)
        {
            await _uow.Menus.AddAsync(menu);
            await _uow.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMenu), new { id = menu.ID }, menu);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutMenu(int id, Menu menu)
        {
            if (id != menu.ID)
            {
                return BadRequest();
            }

            _uow.Menus.Update(menu);

            try
            {
                await _uow.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await MenuExists(id))
                {
                    return NotFound();
                }

                throw;
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMenu(int id)
        {
            var menu = await _uow.Menus.GetByIdAsync(id);
            if (menu == null)
            {
                return NotFound();
            }

            _uow.Menus.Remove(menu);
            await _uow.SaveChangesAsync();

            return NoContent();
        }

        private Task<bool> MenuExists(int id)
            => _uow.Menus.AnyAsync(e => e.ID == id);
    }
}
