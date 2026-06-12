using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartCampus.Application.DTOs.Admin;
using SmartCampus.Application.DTOs.Common;
using SmartCampus.Application.Interfaces;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Api.Controllers
{
    [Route("api/admin/announcements")]
    [ApiController]
    [Authorize(Roles = "admin")]
    public class AdminAnnouncementsController : ControllerBase
    {
        private readonly IUnitOfWork _uow;

        public AdminAnnouncementsController(IUnitOfWork uow)
        {
            _uow = uow;
        }

        // GET /api/admin/announcements
        [HttpGet]
        public async Task<ActionResult<PagedResponse<Announcement>>> GetAll([FromQuery] PaginationQuery query)
        {
            var total = await _uow.Announcements.CountAsync();
            var items = await _uow.Announcements.GetPagedAsync(
                (query.Page - 1) * query.PageSize,
                query.PageSize,
                a => a.Tarih,
                descending: true);

            return Ok(new PagedResponse<Announcement>
            {
                Items = items.ToList(),
                Page = query.Page,
                PageSize = query.PageSize,
                TotalCount = total,
                TotalPages = (int)Math.Ceiling(total / (double)query.PageSize),
                HasNextPage = query.Page * query.PageSize < total
            });
        }

        // GET /api/admin/announcements/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Announcement>> GetById(int id)
        {
            var item = await _uow.Announcements.GetByIdAsync(id);
            if (item == null) return NotFound(new { message = "Duyuru bulunamadı." });
            return Ok(item);
        }

        // POST /api/admin/announcements
        [HttpPost]
        public async Task<ActionResult<Announcement>> Create(CreateAnnouncementRequest request)
        {
            var item = new Announcement
            {
                Baslik   = request.Baslik.Trim(),
                Icerik   = request.Icerik.Trim(),
                Kategori = request.Kategori.Trim(),
                Tarih    = DateTime.UtcNow
            };

            await _uow.Announcements.AddAsync(item);
            await _uow.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = item.ID }, item);
        }

        // PUT /api/admin/announcements/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<Announcement>> Update(int id, UpdateAnnouncementRequest request)
        {
            var item = await _uow.Announcements.GetByIdAsync(id);
            if (item == null) return NotFound(new { message = "Duyuru bulunamadı." });

            item.Baslik   = request.Baslik.Trim();
            item.Icerik   = request.Icerik.Trim();
            item.Kategori = request.Kategori.Trim();

            await _uow.SaveChangesAsync();
            return Ok(item);
        }

        // DELETE /api/admin/announcements/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await _uow.Announcements.GetByIdAsync(id);
            if (item == null) return NotFound(new { message = "Duyuru bulunamadı." });

            _uow.Announcements.Remove(item);
            await _uow.SaveChangesAsync();
            return Ok(new { message = "Duyuru silindi." });
        }
    }
}
