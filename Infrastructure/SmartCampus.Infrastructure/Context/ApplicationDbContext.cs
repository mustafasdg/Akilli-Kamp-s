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
        public DbSet<Appointment> Appointments { get; set; }
        public DbSet<TeacherSchedule> TeacherSchedules { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<Notification> Notifications { get; set; }

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

            // ---- Appointment iliskileri ----

            // Appointment -> Student (User)
            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Student)
                .WithMany()
                .HasForeignKey(a => a.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            // Appointment -> Teacher (User)
            // SQL Server'da ayni tabloya iki FK oldugunda Restrict zorunlu
            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Teacher)
                .WithMany()
                .HasForeignKey(a => a.TeacherId)
                .OnDelete(DeleteBehavior.Restrict);

            // AppointmentStatus enum -> int olarak sakla
            modelBuilder.Entity<Appointment>()
                .Property(a => a.Status)
                .HasConversion<int>();

            // ---- TeacherSchedule iliskileri ----

            // TeacherSchedule -> Teacher (User)
            modelBuilder.Entity<TeacherSchedule>()
                .HasOne(s => s.Teacher)
                .WithMany()
                .HasForeignKey(s => s.TeacherId)
                .OnDelete(DeleteBehavior.Cascade);

            // DayOfWeek enum -> int olarak sakla
            modelBuilder.Entity<TeacherSchedule>()
                .Property(s => s.DayOfWeek)
                .HasConversion<int>();

            // ScheduleType enum -> int olarak sakla
            modelBuilder.Entity<TeacherSchedule>()
                .Property(s => s.Type)
                .HasConversion<int>();

            // Ayni ogretmen, ayni gun, ayni saat blogu tekrarlanamasin
            modelBuilder.Entity<TeacherSchedule>()
                .HasIndex(s => new { s.TeacherId, s.DayOfWeek, s.StartTime })
                .IsUnique();

            // ---- Message iliskileri ----

            // Message -> Sender (User)
            modelBuilder.Entity<Message>()
                .HasOne(m => m.Sender)
                .WithMany()
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            // Message -> Receiver (User)
            modelBuilder.Entity<Message>()
                .HasOne(m => m.Receiver)
                .WithMany()
                .HasForeignKey(m => m.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);

            // Message -> RelatedAppointment (opsiyonel; sistem mesajinin bagli oldugu randevu)
            // Randevu silinince ilgili sistem mesaji da silinir (Cascade) — demo seed reset ile uyumlu.
            modelBuilder.Entity<Message>()
                .HasOne(m => m.RelatedAppointment)
                .WithMany()
                .HasForeignKey(m => m.RelatedAppointmentId)
                .OnDelete(DeleteBehavior.Cascade);

            // Konusma sorgularini hizlandiran composite index
            modelBuilder.Entity<Message>()
                .HasIndex(m => new { m.SenderId, m.ReceiverId, m.Timestamp });

            // ---- Appointment -> TeacherSchedule (opsiyonel baglanti) ----
            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Schedule)
                .WithMany()
                .HasForeignKey(a => a.ScheduleId)
                .OnDelete(DeleteBehavior.SetNull);

            // ---- Notification iliskileri ----

            // Notification -> User (alici)
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Notification -> Appointment (opsiyonel kaynak)
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.Appointment)
                .WithMany()
                .HasForeignKey(n => n.AppointmentId)
                .OnDelete(DeleteBehavior.SetNull);

            // Kullanicinin okunmamis bildirim sorgularini hizlandir
            modelBuilder.Entity<Notification>()
                .HasIndex(n => new { n.UserId, n.IsRead });
        }
    }
}
