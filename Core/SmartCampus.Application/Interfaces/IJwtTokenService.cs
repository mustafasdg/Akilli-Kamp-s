using SmartCampus.Application.DTOs.Auth;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Interfaces
{
    public interface IJwtTokenService
    {
        AuthResponse GenerateToken(User user);
    }
}
