using MediatR;
using SmartCampus.Application.Interfaces;

namespace SmartCampus.Application.Features.AiTools.Queries.GetTeachersForAi
{
    public class GetTeachersForAiQueryHandler
        : IRequestHandler<GetTeachersForAiQuery, IReadOnlyList<AiTeacherDto>>
    {
        private readonly IUnitOfWork _uow;

        public GetTeachersForAiQueryHandler(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<IReadOnlyList<AiTeacherDto>> Handle(
            GetTeachersForAiQuery request,
            CancellationToken cancellationToken)
        {
            var teachers = await _uow.Users.ListAsync(u => u.Role == "teacher", cancellationToken);

            // Nullable alanlar boş string'e indirgenir — ajana giden veride null bırakılmaz.
            return teachers
                .Select(t => new AiTeacherDto
                {
                    Id         = t.ID,
                    FullName   = t.Name,
                    Specialty  = t.Specialty  ?? string.Empty,
                    RoomNumber = t.RoomNumber ?? string.Empty,
                })
                .ToList();
        }
    }
}
