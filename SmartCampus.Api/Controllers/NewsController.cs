using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartCampus.Api.Contracts.Common;
using SmartCampus.Api.Data;
using SmartCampus.Api.Models;

namespace SmartCampus.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NewsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public NewsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<PagedResponse<News>>> GetNewsList([FromQuery] PaginationQuery query)
        {
            var totalCount = await _context.News.CountAsync();
            var items = await _context.News
                .OrderByDescending(n => n.Tarih)
                .Skip(query.Skip)
                .Take(query.PageSize)
                .ToListAsync();

            return Ok(PagedResponse<News>.Create(items, query.SafePage, query.PageSize, totalCount));
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<News>> GetNews(int id)
        {
            var newsItem = await _context.News.FindAsync(id);

            if (newsItem == null)
            {
                return NotFound();
            }

            return newsItem;
        }

        [HttpPost]
        public async Task<ActionResult<News>> PostNews(News newsItem)
        {
            _context.News.Add(newsItem);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetNews), new { id = newsItem.ID }, newsItem);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutNews(int id, News newsItem)
        {
            if (id != newsItem.ID)
            {
                return BadRequest();
            }

            _context.Entry(newsItem).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!NewsExists(id))
                {
                    return NotFound();
                }

                throw;
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNews(int id)
        {
            var newsItem = await _context.News.FindAsync(id);
            if (newsItem == null)
            {
                return NotFound();
            }

            _context.News.Remove(newsItem);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool NewsExists(int id)
        {
            return _context.News.Any(e => e.ID == id);
        }
    }
}
