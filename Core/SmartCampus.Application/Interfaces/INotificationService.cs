namespace SmartCampus.Application.Interfaces
{
    /// <summary>
    /// Push bildirim gonderimi soyutlamasi (Firebase implementasyonu Infrastructure'da).
    /// </summary>
    public interface INotificationService
    {
        Task SendNotificationAsync(string title, string body);
    }
}
