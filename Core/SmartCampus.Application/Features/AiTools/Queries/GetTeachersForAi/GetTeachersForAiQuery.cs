using MediatR;

namespace SmartCampus.Application.Features.AiTools.Queries.GetTeachersForAi
{
    /// <summary>
    /// Tüm öğretim üyelerini AI ajanı için sade <see cref="AiTeacherDto"/> listesi olarak getirir.
    /// </summary>
    public class GetTeachersForAiQuery : IRequest<IReadOnlyList<AiTeacherDto>>
    {
    }
}
