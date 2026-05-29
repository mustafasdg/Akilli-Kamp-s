using SmartCampus.Api.Contracts.Auth;
using SmartCampus.Api.Models;

namespace SmartCampus.Api.Services
{
    public interface IJwtTokenService
    {
        AuthResponse GenerateToken(User user);
    }
}
