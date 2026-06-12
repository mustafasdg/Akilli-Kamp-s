using MediatR;
using SmartCampus.Application.DTOs.Common;
using SmartCampus.Application.Interfaces;
using SmartCampus.Domain.Entities;

namespace SmartCampus.Application.Features.Announcements.Queries.GetAllAnnouncements
{
    public class GetAllAnnouncementsQueryHandler
        : IRequestHandler<GetAllAnnouncementsQuery, PagedResponse<Announcement>>
    {
        private readonly IUnitOfWork _uow;

        public GetAllAnnouncementsQueryHandler(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<PagedResponse<Announcement>> Handle(
            GetAllAnnouncementsQuery request,
            CancellationToken cancellationToken)
        {
            // PaginationQuery sayfa/limit kelepcelemesini ve Skip/SafePage hesabini saglar
            var pagination = new PaginationQuery
            {
                Page = request.Page,
                PageSize = request.PageSize
            };

            var totalCount = await _uow.Announcements.CountAsync(cancellationToken);
            var items = await _uow.Announcements.GetPagedAsync(
                pagination.Skip,
                pagination.PageSize,
                a => a.Tarih,
                descending: true,
                cancellationToken);

            return PagedResponse<Announcement>.Create(
                items.ToList(),
                pagination.SafePage,
                pagination.PageSize,
                totalCount);
        }
    }
}
