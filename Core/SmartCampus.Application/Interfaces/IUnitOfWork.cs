using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Interfaces
{
    /// <summary>
    /// Tek bir DbContext ornegi uzerinden tum repository'leri ve
    /// kaydetme islemini yoneten birim.
    /// </summary>
    public interface IUnitOfWork
    {
        IGenericRepository<Announcement> Announcements { get; }
        IGenericRepository<Event> Events { get; }
        IGenericRepository<News> News { get; }
        IGenericRepository<Menu> Menus { get; }
        IGenericRepository<Location> Locations { get; }
        IGenericRepository<User> Users { get; }
        IGenericRepository<Appointment> Appointments { get; }
        IGenericRepository<TeacherSchedule> TeacherSchedules { get; }
        IGenericRepository<Message> Messages { get; }
        IGenericRepository<Notification> Notifications { get; }

        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}
