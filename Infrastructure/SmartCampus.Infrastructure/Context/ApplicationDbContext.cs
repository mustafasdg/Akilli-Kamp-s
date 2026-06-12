using Microsoft.EntityFrameworkCore;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Infrastructure.Context
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Announcement> Announcements { get; set; }
        public DbSet<Menu> Menus { get; set; }
        public DbSet<Location> Locations { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<News> News { get; set; }
        public DbSet<Event> Events { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User.Email benzersiz (Unique Index)
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // ---- Iliskiler (Foreign Key) ----
            // Restrict: SQL Server'da coklu cascade yollarini onlemek icin otomatik silme yok.

            // Announcement -> AppUser (icerigi olusturan admin, opsiyonel)
            modelBuilder.Entity<Announcement>()
                .HasOne(a => a.AppUser)
                .WithMany()
                .HasForeignKey(a => a.AppUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Announcement -> Location (opsiyonel)
            modelBuilder.Entity<Announcement>()
                .HasOne(a => a.Location)
                .WithMany()
                .HasForeignKey(a => a.LocationId)
                .OnDelete(DeleteBehavior.Restrict);

            // Event -> AppUser (opsiyonel)
            modelBuilder.Entity<Event>()
                .HasOne(e => e.AppUser)
                .WithMany()
                .HasForeignKey(e => e.AppUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Event -> Location (opsiyonel)
            modelBuilder.Entity<Event>()
                .HasOne(e => e.Location)
                .WithMany()
                .HasForeignKey(e => e.LocationId)
                .OnDelete(DeleteBehavior.Restrict);

            // News -> AppUser (opsiyonel)
            modelBuilder.Entity<News>()
                .HasOne(n => n.AppUser)
                .WithMany()
                .HasForeignKey(n => n.AppUserId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
