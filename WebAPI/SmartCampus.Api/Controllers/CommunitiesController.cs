using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartCampus.Application.DTOs.Community;
using SmartCampus.Application.Interfaces;

namespace SmartCampus.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CommunitiesController : ControllerBase
    {
        private readonly ICommunityService _communityService;

        public CommunitiesController(ICommunityService communityService)
        {
            _communityService = communityService;
        }

        /// <summary>
        /// Giriş yapan kullanıcının HENÜZ ÜYE OLMADIĞI toplulukları (Keşfet) getirir.
        /// GET /api/communities/discover
        /// </summary>
        [HttpGet("discover")]
        public async Task<ActionResult<List<CommunityDto>>> GetDiscover(CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            if (userId is null) return Unauthorized();

            var result = await _communityService.GetDiscoverCommunitiesAsync(userId.Value, ct);
            return Ok(result);
        }

        /// <summary>
        /// Giriş yapan kullanıcının ÜYE OLDUĞU toplulukları getirir.
        /// GET /api/communities/my
        /// </summary>
        [HttpGet("my")]
        public async Task<ActionResult<List<CommunityDto>>> GetMy(CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            if (userId is null) return Unauthorized();

            var result = await _communityService.GetMyCommunitiesAsync(userId.Value, ct);
            return Ok(result);
        }

        /// <summary>
        /// Giriş yapan kullanıcıyı belirtilen topluluğa üye yapar.
        /// POST /api/communities/{id}/join
        /// </summary>
        [HttpPost("{id:int}/join")]
        public async Task<IActionResult> Join(int id, CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            if (userId is null) return Unauthorized();

            var joined = await _communityService.JoinCommunityAsync(userId.Value, id, ct);

            // false → topluluk bulunamadı ya da kullanıcı zaten üye
            if (!joined)
                return BadRequest(new { message = "Topluluğa katılınamadı: topluluk bulunamadı veya zaten üyesiniz." });

            return Ok(new { message = "Topluluğa başarıyla katıldınız." });
        }

        /// <summary>
        /// Yeni bir topluluk oluşturur. Yalnızca admin rolü erişebilir.
        /// POST /api/communities
        /// Body: { name, description, imageUrl? }
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<CommunityDto>> Create(
            [FromBody] CreateCommunityRequest request,
            CancellationToken ct)
        {
            try
            {
                var created = await _communityService.CreateCommunityAsync(request, ct);
                return CreatedAtAction(nameof(GetDiscover), new { }, created);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Sistemdeki tüm toplulukları getirir. Yalnızca admin (yönetim ekranı).
        /// GET /api/communities/all
        /// </summary>
        [HttpGet("all")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<List<CommunityDto>>> GetAll(CancellationToken ct)
        {
            var result = await _communityService.GetAllCommunitiesAsync(ct);
            return Ok(result);
        }

        /// <summary>
        /// Mevcut bir topluluğu günceller. Yalnızca admin.
        /// PUT /api/communities/{id}
        /// </summary>
        [HttpPut("{id:int}")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<CommunityDto>> Update(
            int id,
            [FromBody] UpdateCommunityRequest request,
            CancellationToken ct)
        {
            try
            {
                var updated = await _communityService.UpdateCommunityAsync(id, request, ct);
                if (updated is null) return NotFound(new { message = "Topluluk bulunamadı." });
                return Ok(updated);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Bir topluluğu siler (üyelikler ve mesajlar dahil). Yalnızca admin.
        /// DELETE /api/communities/{id}
        /// </summary>
        [HttpDelete("{id:int}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Delete(int id, CancellationToken ct)
        {
            var deleted = await _communityService.DeleteCommunityAsync(id, ct);
            if (!deleted) return NotFound(new { message = "Topluluk bulunamadı." });
            return Ok(new { message = "Topluluk silindi." });
        }

        /// <summary>
        /// Bir topluluğun geçmiş mesajlarını kronolojik sırayla getirir.
        /// Yalnızca topluluğun üyeleri erişebilir.
        /// GET /api/communities/{id}/messages
        /// </summary>
        [HttpGet("{id:int}/messages")]
        public async Task<ActionResult<List<CommunityMessageDto>>> GetMessages(int id, CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            if (userId is null) return Unauthorized();

            // Yalnızca üyeler geçmişi okuyabilir
            var isMember = await _communityService.IsMemberAsync(userId.Value, id, ct);
            if (!isMember) return Forbid();

            var messages = await _communityService.GetCommunityMessagesAsync(id, ct);
            return Ok(messages);
        }

        private int? GetCurrentUserId()
        {
            var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(value, out var id) ? id : null;
        }
    }
}
