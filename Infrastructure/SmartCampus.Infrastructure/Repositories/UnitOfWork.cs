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
        }

        public IGenericRepository<Announcement> Announcements { get; }
        public IGenericRepository<Event> Events { get; }
        public IGenericRepository<News> News { get; }
        public IGenericRepository<Menu> Menus { get; }
        public IGenericRepository<Location> Locations { get; }
        public IGenericRepository<User> Users { get; }

        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
            => _context.SaveChangesAsync(cancellationToken);
    }
}
