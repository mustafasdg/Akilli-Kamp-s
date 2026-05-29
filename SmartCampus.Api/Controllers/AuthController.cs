using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartCampus.Api.Contracts.Auth;
using SmartCampus.Api.Data;
using SmartCampus.Api.Models;
using SmartCampus.Api.Services;

namespace SmartCampus.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IPasswordHasher<User> _passwordHasher;
        private readonly IJwtTokenService _jwtTokenService;

        public AuthController(
            ApplicationDbContext context,
            IPasswordHasher<User> passwordHasher,
            IJwtTokenService jwtTokenService)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _jwtTokenService = jwtTokenService;
        }

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
        {
            var normalizedEmail = request.Email.Trim().ToLowerInvariant();

            var userExists = await _context.Users.AnyAsync(u => u.Email == normalizedEmail);
            if (userExists)
            {
                return Conflict(new { message = "Bu e-posta ile kayitli bir kullanici zaten var." });
            }

            var user = new User
            {
                Name = request.Name.Trim(),
                Email = normalizedEmail,
                CreatedAt = DateTime.UtcNow
            };

            user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var authResponse = _jwtTokenService.GenerateToken(user);
            return Ok(authResponse);
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
        {
            var normalizedEmail = request.Email.Trim().ToLowerInvariant();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail);

            if (user == null)
            {
                return Unauthorized(new { message = "E-posta veya sifre hatali." });
            }

            var verifyResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
            if (verifyResult == PasswordVerificationResult.Failed)
            {
                return Unauthorized(new { message = "E-posta veya sifre hatali." });
            }

            var authResponse = _jwtTokenService.GenerateToken(user);
            return Ok(authResponse);
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<UserResponse>> Me()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Gecersiz kullanici bilgisi." });
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "Kullanici bulunamadi." });
            }

            return Ok(new UserResponse
            {
                Id = user.ID,
                Name = user.Name,
                Email = user.Email,
                CreatedAt = user.CreatedAt
            });
        }
    }
}
