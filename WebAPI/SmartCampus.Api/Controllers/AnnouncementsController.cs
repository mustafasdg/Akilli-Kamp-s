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
    public class AnnouncementsController : ControllerBase
    {
        private readonly IUnitOfWork _uow;
        private readonly INotificationService _notificationService;

        public AnnouncementsController(IUnitOfWork uow, INotificationService notificationService)
        {
            _uow = uow;
            _notificationService = notificationService;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<PagedResponse<Announcement>>> GetAnnouncements([FromQuery] PaginationQuery query)
        {
            var totalCount = await _uow.Announcements.CountAsync();
            var items = await _uow.Announcements.GetPagedAsync(query.Skip, query.PageSize, a => a.Tarih, descending: true);

            return Ok(PagedResponse<Announcement>.Create(items.ToList(), query.SafePage, query.PageSize, totalCount));
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<Announcement>> GetAnnouncement(int id)
        {
            var announcement = await _uow.Announcements.GetByIdAsync(id);

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
            await _uow.Announcements.AddAsync(announcement);
            await _uow.SaveChangesAsync();

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

            _uow.Announcements.Update(announcement);

            try
            {
                await _uow.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await AnnouncementExists(id))
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
            var announcement = await _uow.Announcements.GetByIdAsync(id);
            if (announcement == null)
            {
                return NotFound();
            }

            _uow.Announcements.Remove(announcement);
            await _uow.SaveChangesAsync();

            return NoContent();
        }

        private Task<bool> AnnouncementExists(int id)
            => _uow.Announcements.AnyAsync(e => e.ID == id);
    }
}
