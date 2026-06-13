using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartCampus.Application.Features.AiTools.Queries.GetTeacherScheduleForAi;
using SmartCampus.Application.Features.AiTools.Queries.GetTeachersForAi;

namespace SmartCampus.Api.Controllers
{
    /// <summary>
    /// LangGraph tabanlı Python AI ajanına özel, izole salt-okunur uçlar.
    /// Mobil arayüz tarafından tüketilmez; yalnızca LLM "Tool / Function Calling" amaçlıdır.
    /// Dönen veriler bilinçli olarak minimal tutulur (null/karmaşık obje yok).
    ///
    /// GÜVENLİK NOTU: Mevcut salt-okunur uçlarla (UsersController, SchedulesController)
    /// tutarlı olması için şimdilik [AllowAnonymous]. Üretimde yalnızca dahili ajan
    /// erişebilsin diye bir API anahtarı / ağ izolasyonu ile sınırlandırılması önerilir.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [AllowAnonymous]
    public class AiToolsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public AiToolsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        /// <summary>
        /// Tüm öğretim üyelerini sade AI formatında listeler.
        /// GET /api/aitools/teachers
        /// </summary>
        [HttpGet("teachers")]
        public async Task<ActionResult<IReadOnlyList<AiTeacherDto>>> GetTeachers(
            CancellationToken ct)
        {
            var result = await _mediator.Send(new GetTeachersForAiQuery(), ct);
            return Ok(result);
        }

        /// <summary>
        /// Belirtilen öğretmenin haftalık programını dolu/boş durumuyla getirir.
        /// GET /api/aitools/schedules/{teacherId}
        /// </summary>
        [HttpGet("schedules/{teacherId:int}")]
        public async Task<ActionResult<IReadOnlyList<AiScheduleDto>>> GetTeacherSchedule(
            int teacherId, CancellationToken ct)
        {
            var result = await _mediator.Send(
                new GetTeacherScheduleForAiQuery { TeacherId = teacherId }, ct);
            return Ok(result);
        }
    }
}
