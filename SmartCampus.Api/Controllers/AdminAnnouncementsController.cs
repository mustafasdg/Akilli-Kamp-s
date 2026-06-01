using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartCampus.Api.Contracts.Admin;
using SmartCampus.Api.Contracts.Common;
using SmartCampus.Api.Data;
using SmartCampus.Api.Models;

namespace SmartCampus.Api.Controllers
{
    [Route("api/admin/announcements")]
    [ApiController]
    [Authorize(Roles = "admin")]
    public class AdminAnnouncementsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminAnnouncementsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET /api/admin/announcements
        [HttpGet]
        public async Task<ActionResult<PagedResponse<Announcement>>> GetAll([FromQuery] PaginationQuery query)
        {
            var q = _context.Announcements.OrderByDescending(a => a.Tarih);
            var total = await q.CountAsync();
            var items = await q
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .ToListAsync();

            return Ok(new PagedResponse<Announcement>
            {
                Items = items,
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
            var item = await _context.Announcements.FindAsync(id);
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

            _context.Announcements.Add(item);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = item.ID }, item);
        }

        // PUT /api/admin/announcements/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<Announcement>> Update(int id, UpdateAnnouncementRequest request)
        {
            var item = await _context.Announcements.FindAsync(id);
            if (item == null) return NotFound(new { message = "Duyuru bulunamadı." });

            item.Baslik   = request.Baslik.Trim();
            item.Icerik   = request.Icerik.Trim();
            item.Kategori = request.Kategori.Trim();

            await _context.SaveChangesAsync();
            return Ok(item);
        }

        // DELETE /api/admin/announcements/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await _context.Announcements.FindAsync(id);
            if (item == null) return NotFound(new { message = "Duyuru bulunamadı." });

            _context.Announcements.Remove(item);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Duyuru silindi." });
        }
    }
}
