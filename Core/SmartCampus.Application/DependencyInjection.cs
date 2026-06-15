using Microsoft.Extensions.DependencyInjection;
using SmartCampus.Application.Interfaces;
using SmartCampus.Application.Services;

namespace SmartCampus.Application
{
    /// <summary>
    /// Application katmaninin DI kayitlari (MediatR / CQRS handler'lari ve servisler).
    /// </summary>
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
            // Tum IRequestHandler / INotificationHandler'lari bu assembly'den tara ve kaydet
            services.AddMediatR(cfg =>
                cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));

            // Randevu ve program servisleri
            services.AddScoped<IAppointmentService, AppointmentService>();
            services.AddScoped<ITeacherScheduleService, TeacherScheduleService>();
            services.AddScoped<IMessageService, MessageService>();

            // Topluluk servisi
            services.AddScoped<ICommunityService, CommunityService>();

            return services;
        }
    }
}
