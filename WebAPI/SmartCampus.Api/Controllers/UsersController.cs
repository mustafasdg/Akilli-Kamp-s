using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartCampus.Application.Interfaces;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly IUnitOfWork _uow;

        public UsersController(IUnitOfWork uow)
        {
            _uow = uow;
        }

        /// <summary>
        /// Kullanıcıları role göre listeler.
        /// GET /api/users?role=teacher
        /// </summary>
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IReadOnlyList<PublicUserDto>>> GetUsers(
            [FromQuery] string? role,
            CancellationToken ct)
        {
            IReadOnlyList<User> users;

            if (!string.IsNullOrWhiteSpace(role))
                users = await _uow.Users.ListAsync(u => u.Role == role.ToLower(), ct);
            else
                users = await _uow.Users.ListAsync(u => true, ct);

            var result = users.Select(u => new PublicUserDto
            {
                Id             = u.ID,
                Name           = u.Name,
                Email          = u.Email,
                Role           = u.Role,
                Bio            = u.Bio,
                OfficeLocation = u.OfficeLocation,
                ResearchAreas  = u.ResearchAreas,
                RoomNumber     = u.RoomNumber,
                Specialty      = u.Specialty,
            });

            return Ok(result);
        }

        /// <summary>
        /// Giriş yapan kullanıcının kendi profilini getirir.
        /// GET /api/users/me
        /// </summary>
        [HttpGet("me")]
        public async Task<ActionResult<PublicUserDto>> GetMe(CancellationToken ct)
        {
            var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(idStr, out var userId)) return Unauthorized();

            var user = await _uow.Users.GetByIdAsync(userId, ct);
            if (user is null) return NotFound();

            return Ok(new PublicUserDto
            {
                Id             = user.ID,
                Name           = user.Name,
                Email          = user.Email,
                Role           = user.Role,
                Bio            = user.Bio,
                OfficeLocation = user.OfficeLocation,
                ResearchAreas  = user.ResearchAreas,
                RoomNumber     = user.RoomNumber,
                Specialty      = user.Specialty,
            });
        }
    }

    public record PublicUserDto
    {
        public int     Id             { get; init; }
        public string  Name           { get; init; } = string.Empty;
        public string  Email          { get; init; } = string.Empty;
        public string  Role           { get; init; } = string.Empty;
        public string? Bio            { get; init; }
        public string? OfficeLocation { get; init; }
        public string? ResearchAreas  { get; init; }
        public string? RoomNumber     { get; init; }
        public string? Specialty      { get; init; }
    }
}
