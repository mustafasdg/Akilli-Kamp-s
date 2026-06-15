using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SmartCampus.Application;
using SmartCampus.Application.Common;
using SmartCampus.Domain.Entities;
using SmartCampus.Infrastructure;
using SmartCampus.Infrastructure.Context;
using SmartCampus.Infrastructure.Persistence;
using SmartCampus.Api.Hubs;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddConsole();

var dataProtectionPath = Path.Combine(builder.Environment.ContentRootPath, "data-protection-keys");
Directory.CreateDirectory(dataProtectionPath);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Gerçek zamanlı topluluk sohbeti için SignalR
builder.Services.AddSignalR();

builder.Services
    .AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(dataProtectionPath))
    .SetApplicationName("SmartCampus.Api");

// Application katmani: MediatR / CQRS handler'lari
builder.Services.AddApplicationServices();

// Infrastructure katmani: SQL Server DbContext, repository'ler ve servisler
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection(JwtSettings.SectionName));

var jwtSettings = builder.Configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>() ?? new JwtSettings();
if (string.IsNullOrWhiteSpace(jwtSettings.Key))
{
    throw new InvalidOperationException("JWT ayarlari bulunamadi. appsettings.json icinde Jwt bolumunu kontrol edin.");
}

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Key)),
            ClockSkew = TimeSpan.Zero
        };

        // SignalR: WebSocket'ler header gönderemediği için token'ı "access_token"
        // query string'inden oku (yalnızca /hubs yollarında).
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        // SignalR ile uyumlu: AllowCredentials + AllowAnyOrigin birlikte kullanılamadığı
        // için origin'i dinamik olarak yansıtıyoruz.
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<ApplicationDbContext>();
    context.Database.Migrate();

    var passwordHasher = services.GetRequiredService<IPasswordHasher<User>>();

    // Sahte akademisyenleri temizleyip gerçek ISUBÜ kadrosunu yükle.
    // Ders programı tohumlaması bu hocalara göre kurulduğundan DbInitializer'dan ÖNCE çalışmalı.
    await DatabaseSeeder.SeedTeachersAsync(context, passwordHasher);

    DbInitializer.Initialize(context, passwordHasher);

    // Topluluklar tablosu boşsa demo topluluklarını otomatik tohumla
    await DatabaseSeeder.SeedCommunitiesAsync(context);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<CommunityHub>("/hubs/community");

app.Run();
