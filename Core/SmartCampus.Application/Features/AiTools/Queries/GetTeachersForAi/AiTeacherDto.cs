namespace SmartCampus.Application.Features.AiTools.Queries.GetTeachersForAi
{
    /// <summary>
    /// LLM ajanının "Tool / Function Calling" ile tükettiği sade öğretim üyesi kaydı.
    /// Yalnızca ajanın ihtiyaç duyduğu alanlar tutulur; null veya karmaşık obje barındırmaz.
    /// </summary>
    public class AiTeacherDto
    {
        public int Id { get; set; }

        public string FullName { get; set; } = string.Empty;

        public string Specialty { get; set; } = string.Empty;

        public string RoomNumber { get; set; } = string.Empty;
    }
}
