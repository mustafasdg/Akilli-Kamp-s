using FirebaseAdmin;
using Microsoft.Extensions.Logging;
using SmartCampus.Application.Interfaces;

namespace SmartCampus.Infrastructure.Services
{
    public class FirebaseNotificationService : INotificationService
    {
        private readonly ILogger<FirebaseNotificationService> _logger;

        public FirebaseNotificationService(ILogger<FirebaseNotificationService> logger)
        {
            _logger = logger;

            // In production, you would initialize this in Program.cs with your valid serviceAccountKey.json
            try
            {
                if (FirebaseApp.DefaultInstance == null)
                {
                    /*
                    FirebaseApp.Create(new AppOptions()
                    {
                        Credential = GoogleCredential.FromFile("serviceAccountKey.json")
                    });
                    */
                    _logger.LogWarning("Firebase App initialized via placeholder. Actual credentials needed.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error initializing Firebase");
            }
        }

        public async Task SendNotificationAsync(string title, string body)
        {
            try
            {
                // Commented out the actual sending logic to prevent crashes if Firebase is not properly configured by the user yet.
                /*
                var message = new Message()
                {
                    Notification = new Notification
                    {
                        Title = title,
                        Body = body
                    },
                    Topic = "all" // Tüm kullanıcılara
                };

                string response = await FirebaseMessaging.DefaultInstance.SendAsync(message);
                _logger.LogInformation("Successfully sent message: {Response}", response);
                */

                _logger.LogInformation("SIMULATED PUSH NOTIFICATION: Title: {Title}, Body: {Body}", title, body);
                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send notification");
            }
        }
    }
}
