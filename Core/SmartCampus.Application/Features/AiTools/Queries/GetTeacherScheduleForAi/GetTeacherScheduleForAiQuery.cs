using MediatR;

namespace SmartCampus.Application.Features.AiTools.Queries.GetTeacherScheduleForAi
{
    /// <summary>
    /// Belirtilen öğretmenin haftalık programını, her bloğun nihai dolu/boş durumuyla
    /// birlikte AI ajanı için sade <see cref="AiScheduleDto"/> listesi olarak getirir.
    /// </summary>
    public class GetTeacherScheduleForAiQuery : IRequest<IReadOnlyList<AiScheduleDto>>
    {
        public int TeacherId { get; set; }
    }
}
