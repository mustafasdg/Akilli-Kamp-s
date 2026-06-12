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
    public class NewsController : ControllerBase
    {
        private readonly IUnitOfWork _uow;

        public NewsController(IUnitOfWork uow)
        {
            _uow = uow;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<PagedResponse<News>>> GetNewsList([FromQuery] PaginationQuery query)
        {
            var totalCount = await _uow.News.CountAsync();
            var items = await _uow.News.GetPagedAsync(query.Skip, query.PageSize, n => n.Tarih, descending: true);

            return Ok(PagedResponse<News>.Create(items.ToList(), query.SafePage, query.PageSize, totalCount));
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<News>> GetNews(int id)
        {
            var newsItem = await _uow.News.GetByIdAsync(id);

            if (newsItem == null)
            {
                return NotFound();
            }

            return newsItem;
        }

        [HttpPost]
        public async Task<ActionResult<News>> PostNews(News newsItem)
        {
            await _uow.News.AddAsync(newsItem);
            await _uow.SaveChangesAsync();

            return CreatedAtAction(nameof(GetNews), new { id = newsItem.ID }, newsItem);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutNews(int id, News newsItem)
        {
            if (id != newsItem.ID)
            {
                return BadRequest();
            }

            _uow.News.Update(newsItem);

            try
            {
                await _uow.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await NewsExists(id))
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
            var newsItem = await _uow.News.GetByIdAsync(id);
            if (newsItem == null)
            {
                return NotFound();
            }

            _uow.News.Remove(newsItem);
            await _uow.SaveChangesAsync();

            return NoContent();
        }

        private Task<bool> NewsExists(int id)
            => _uow.News.AnyAsync(e => e.ID == id);
    }
}
