using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartCampus.Api.Contracts.Common;
using SmartCampus.Api.Data;
using SmartCampus.Api.Models;
using SmartCampus.Api.Services;

namespace SmartCampus.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AnnouncementsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly FirebaseNotificationService _notificationService;

        public AnnouncementsController(ApplicationDbContext context, FirebaseNotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<PagedResponse<Announcement>>> GetAnnouncements([FromQuery] PaginationQuery query)
        {
            var totalCount = await _context.Announcements.CountAsync();
            var items = await _context.Announcements
                .OrderByDescending(a => a.Tarih)
                .Skip(query.Skip)
                .Take(query.PageSize)
                .ToListAsync();

            return Ok(PagedResponse<Announcement>.Create(items, query.SafePage, query.PageSize, totalCount));
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<Announcement>> GetAnnouncement(int id)
        {
            var announcement = await _context.Announcements.FindAsync(id);

            if (announcement == null)
            {
                return NotFound();
            }

            return announcement;
        }

        [HttpPost]
        public async Task<ActionResult<Announcement>> PostAnnouncement(Announcement announcement)
        {
            announcement.Tarih = DateTime.UtcNow;
            _context.Announcements.Add(announcement);
            await _context.SaveChangesAsync();

            await _notificationService.SendNotificationAsync(
                "Yeni Duyuru: " + announcement.Baslik,
                announcement.Icerik);

            return CreatedAtAction(nameof(GetAnnouncement), new { id = announcement.ID }, announcement);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutAnnouncement(int id, Announcement announcement)
        {
            if (id != announcement.ID)
            {
                return BadRequest();
            }

            _context.Entry(announcement).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!AnnouncementExists(id))
                {
                    return NotFound();
                }

                throw;
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAnnouncement(int id)
        {
            var announcement = await _context.Announcements.FindAsync(id);
            if (announcement == null)
            {
                return NotFound();
            }

            _context.Announcements.Remove(announcement);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool AnnouncementExists(int id)
        {
            return _context.Announcements.Any(e => e.ID == id);
        }
    }
}
