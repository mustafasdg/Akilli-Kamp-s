using MediatR;
using SmartCampus.Application.Interfaces;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Features.Announcements.Commands.CreateAnnouncement
{
    public class CreateAnnouncementCommandHandler
        : IRequestHandler<CreateAnnouncementCommand, Announcement>
    {
        private readonly IUnitOfWork _uow;
        private readonly INotificationService _notificationService;

        public CreateAnnouncementCommandHandler(IUnitOfWork uow, INotificationService notificationService)
        {
            _uow = uow;
            _notificationService = notificationService;
        }

        public async Task<Announcement> Handle(CreateAnnouncementCommand request, CancellationToken cancellationToken)
        {
            // a) Gelen veriyi entity'ye donustur ve veritabanina kaydet
            var announcement = new Announcement
            {
                Baslik = request.Baslik.Trim(),
                Icerik = request.Icerik.Trim(),
                Kategori = request.Kategori.Trim(),
                Tarih = DateTime.UtcNow
            };

            await _uow.Announcements.AddAsync(announcement, cancellationToken);
            await _uow.SaveChangesAsync(cancellationToken);

            // b) Kayit basarili olduktan sonra mobil uygulamaya push bildirimi gonder
            await _notificationService.SendNotificationAsync(
                "Yeni Duyuru: " + announcement.Baslik,
                announcement.Icerik);

            return announcement;
        }
    }
}
