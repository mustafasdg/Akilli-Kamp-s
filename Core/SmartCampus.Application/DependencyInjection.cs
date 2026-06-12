using Microsoft.Extensions.DependencyInjection;

namespace SmartCampus.Application
{
    /// <summary>
    /// Application katmaninin DI kayitlari (MediatR / CQRS handler'lari).
    /// </summary>
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
            // Tum IRequestHandler / INotificationHandler'lari bu assembly'den tara ve kaydet
            services.AddMediatR(cfg =>
                cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));

            return services;
        }
    }
}
