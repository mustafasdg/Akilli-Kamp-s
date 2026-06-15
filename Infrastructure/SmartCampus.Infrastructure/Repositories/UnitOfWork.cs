using SmartCampus.Application.Interfaces;
using SmartCampus.Domain.Entities;
using SmartCampus.Infrastructure.Context;

namespace SmartCampus.Infrastructure.Repositories
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly ApplicationDbContext _context;

        public UnitOfWork(ApplicationDbContext context)
        {
            _context = context;
            Announcements = new GenericRepository<Announcement>(context);
            Events = new GenericRepository<Event>(context);
            News = new GenericRepository<News>(context);
            Menus = new GenericRepository<Menu>(context);
            Locations = new GenericRepository<Location>(context);
            Users = new GenericRepository<User>(context);
            Appointments = new GenericRepository<Appointment>(context);
            TeacherSchedules = new GenericRepository<TeacherSchedule>(context);
            Messages = new GenericRepository<Message>(context);
            Notifications = new GenericRepository<Notification>(context);
            Communities = new GenericRepository<Community>(context);
            UserCommunities = new GenericRepository<UserCommunity>(context);
            CommunityMessages = new GenericRepository<CommunityMessage>(context);
        }

        public IGenericRepository<Announcement> Announcements { get; }
        public IGenericRepository<Event> Events { get; }
        public IGenericRepository<News> News { get; }
        public IGenericRepository<Menu> Menus { get; }
        public IGenericRepository<Location> Locations { get; }
        public IGenericRepository<User> Users { get; }
        public IGenericRepository<Appointment> Appointments { get; }
        public IGenericRepository<TeacherSchedule> TeacherSchedules { get; }
        public IGenericRepository<Message> Messages { get; }
        public IGenericRepository<Notification> Notifications { get; }
        public IGenericRepository<Community> Communities { get; }
        public IGenericRepository<UserCommunity> UserCommunities { get; }
        public IGenericRepository<CommunityMessage> CommunityMessages { get; }

        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
            => _context.SaveChangesAsync(cancellationToken);
    }
}
