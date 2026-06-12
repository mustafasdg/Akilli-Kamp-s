using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SmartCampus.Application.Interfaces;
using SmartCampus.Domain.Entities;
using SmartCampus.Infrastructure.Context;
using SmartCampus.Infrastructure.Repositories;
using SmartCampus.Infrastructure.Services;

namespace SmartCampus.Infrastructure
{
    /// <summary>
    /// Infrastructure katmaninin DI kayitlari (DbContext, repository'ler, servisler).
    /// </summary>
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("SQL Server baglanti metni (ConnectionStrings:DefaultConnection) bulunamadi.");

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(connectionString));

            // Repository / Unit of Work
            services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
            services.AddScoped<IUnitOfWork, UnitOfWork>();

            // Uygulama servisleri
            services.AddScoped<IJwtTokenService, JwtTokenService>();
            services.AddSingleton<INotificationService, FirebaseNotificationService>();
            services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

            return services;
        }
    }
}
