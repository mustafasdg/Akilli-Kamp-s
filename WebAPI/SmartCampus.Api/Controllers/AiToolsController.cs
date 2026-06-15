using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartCampus.Application.Features.AiTools.Queries.GetTeacherScheduleForAi;
using SmartCampus.Application.Features.AiTools.Queries.GetTeachersForAi;
using SmartCampus.Application.Features.Appointments.Commands.CreateAppointment;

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

        /// <summary>
        /// AI ajanının öğrenci adına randevu oluşturmasını sağlar; mevcut CreateAppointmentCommand'ı tetikler.
        /// POST /api/aitools/appointments
        /// Body: { teacherId, studentId, date: "YYYY-MM-DD", startTime: "HH:mm", endTime: "HH:mm" }
        /// </summary>
        [HttpPost("appointments")]
        public async Task<IActionResult> CreateAppointment(
            [FromBody] AiAppointmentRequestDto dto, CancellationToken ct)
        {
            // AI tarafı tarih/saatleri string gönderir; esnek parse edip birleştiririz.
            if (!DateOnly.TryParse(dto.Date, out var date))
                return BadRequest(new { message = "Geçersiz tarih formatı. Beklenen: YYYY-MM-DD." });

            if (!TimeOnly.TryParse(dto.StartTime, out var start))
                return BadRequest(new { message = "Geçersiz başlangıç saati formatı. Beklenen: HH:mm." });

            if (dto.StudentId <= 0 || dto.TeacherId <= 0)
                return BadRequest(new { message = "Geçerli öğrenci ve öğretmen kimliği gerekir." });

            // Randevu saati yerel duvar saati (Kind=Unspecified) — AppointmentService bunu bekler.
            var appointmentDate = date.ToDateTime(start);

            try
            {
                var appointment = await _mediator.Send(new CreateAppointmentCommand
                {
                    StudentId       = dto.StudentId,
                    TeacherId       = dto.TeacherId,
                    ScheduleId      = null, // servis, tarih + saatten uygun slotu kendisi çözer
                    AppointmentDate = appointmentDate,
                    Description     = "Yapay zeka asistanı aracılığıyla oluşturuldu.",
                }, ct);

                return Ok(new { message = "Randevu talebiniz hocaya iletildi, hocanın onayı bekleniyor.", appointmentId = appointment.ID });
            }
            catch (InvalidOperationException ex)
            {
                // Çakışma / dolu slot / mesai dışı vb. → mesaj LLM'e iletilmek üzere döner.
                return BadRequest(new { message = ex.Message });
            }
        }
    }

    /// <summary>
    /// LLM ajanının randevu oluşturmak için gönderdiği minimal istek modeli.
    /// Tarih/saatler string gelir (date: "YYYY-MM-DD", startTime/endTime: "HH:mm").
    /// </summary>
    public record AiAppointmentRequestDto
    {
        public int    TeacherId { get; init; }
        public int    StudentId { get; init; }
        public string Date      { get; init; } = string.Empty;
        public string StartTime { get; init; } = string.Empty;
        public string EndTime   { get; init; } = string.Empty;
    }
}
