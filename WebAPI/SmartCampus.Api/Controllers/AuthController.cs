using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using SmartCampus.Application.DTOs.Auth;
using SmartCampus.Application.Interfaces;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IUnitOfWork _uow;
        private readonly IPasswordHasher<User> _passwordHasher;
        private readonly IJwtTokenService _jwtTokenService;

        // Şifre sıfırlama kodları (email → (kod, süre))
        private static readonly Dictionary<string, (string Code, DateTime Expiry)> _resetCodes = new();

        public AuthController(
            IUnitOfWork uow,
            IPasswordHasher<User> passwordHasher,
            IJwtTokenService jwtTokenService)
        {
            _uow = uow;
            _passwordHasher = passwordHasher;
            _jwtTokenService = jwtTokenService;
        }

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
        {
            var normalizedEmail = request.Email.Trim().ToLowerInvariant();

            var userExists = await _uow.Users.AnyAsync(u => u.Email == normalizedEmail);
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
            await _uow.Users.AddAsync(user);
            await _uow.SaveChangesAsync();

            var authResponse = _jwtTokenService.GenerateToken(user);
            return Ok(authResponse);
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
        {
            var normalizedEmail = request.Email.Trim().ToLowerInvariant();
            var user = await _uow.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail);

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
                return Unauthorized(new { message = "Gecersiz kullanici bilgisi." });

            var user = await _uow.Users.GetByIdAsync(userId);
            if (user == null)
                return NotFound(new { message = "Kullanici bulunamadi." });

            return Ok(new UserResponse
            {
                Id = user.ID,
                Name = user.Name,
                Email = user.Email,
                CreatedAt = user.CreatedAt,
                Role = user.Role
            });
        }

        // PATCH /api/auth/profile  →  isim güncelle
        [HttpPatch("profile")]
        [Authorize]
        public async Task<ActionResult<UserResponse>> UpdateProfile(UpdateProfileRequest request)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId))
                return Unauthorized(new { message = "Gecersiz kullanici bilgisi." });

            var user = await _uow.Users.GetByIdAsync(userId);
            if (user == null)
                return NotFound(new { message = "Kullanici bulunamadi." });

            user.Name = request.Name.Trim();
            await _uow.SaveChangesAsync();

            return Ok(new UserResponse
            {
                Id = user.ID,
                Name = user.Name,
                Email = user.Email,
                CreatedAt = user.CreatedAt,
                Role = user.Role
            });
        }

        // POST /api/auth/forgot-password  →  6 haneli kod üret
        [HttpPost("forgot-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request)
        {
            var email = request.Email.Trim().ToLowerInvariant();
            var user = await _uow.Users.FirstOrDefaultAsync(u => u.Email == email);

            // Kullanıcı yoksa bile aynı yanıtı döndür (güvenlik gereği)
            if (user != null)
            {
                var code = new Random().Next(100000, 999999).ToString();
                _resetCodes[email] = (code, DateTime.UtcNow.AddMinutes(10));
                // Gerçek uygulamada e-posta gönderilir; demo için kod yanıtta döner
                return Ok(new { message = "Sıfırlama kodu gönderildi.", code });
            }

            return Ok(new { message = "Sıfırlama kodu gönderildi." });
        }

        // POST /api/auth/reset-password  →  kodu doğrula + şifreyi güncelle
        [HttpPost("reset-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ResetPassword(ResetPasswordRequest request)
        {
            var email = request.Email.Trim().ToLowerInvariant();

            if (!_resetCodes.TryGetValue(email, out var entry))
                return BadRequest(new { message = "Geçersiz veya süresi dolmuş kod." });

            if (entry.Expiry < DateTime.UtcNow)
            {
                _resetCodes.Remove(email);
                return BadRequest(new { message = "Kodun süresi dolmuş. Lütfen tekrar isteyin." });
            }

            if (entry.Code != request.Code)
                return BadRequest(new { message = "Sıfırlama kodu hatalı." });

            var user = await _uow.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null) return NotFound(new { message = "Kullanıcı bulunamadı." });

            user.PasswordHash = _passwordHasher.HashPassword(user, request.NewPassword);
            await _uow.SaveChangesAsync();
            _resetCodes.Remove(email);

            return Ok(new { message = "Şifreniz başarıyla sıfırlandı." });
        }

        // PATCH /api/auth/password  →  şifre değiştir
        [HttpPatch("password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword(ChangePasswordRequest request)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId))
                return Unauthorized(new { message = "Gecersiz kullanici bilgisi." });

            var user = await _uow.Users.GetByIdAsync(userId);
            if (user == null)
                return NotFound(new { message = "Kullanici bulunamadi." });

            var verifyResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.CurrentPassword);
            if (verifyResult == PasswordVerificationResult.Failed)
                return BadRequest(new { message = "Mevcut şifre yanlış." });

            user.PasswordHash = _passwordHasher.HashPassword(user, request.NewPassword);
            await _uow.SaveChangesAsync();

            return Ok(new { message = "Şifre başarıyla güncellendi." });
        }
    }
}
