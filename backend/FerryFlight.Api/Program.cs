using System.Threading.RateLimiting;
using FerryFlight.Api.Services;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });
builder.Services.AddOpenApi();
builder.Services.AddMemoryCache();

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders =
        ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    // Cloud Run / Cloudflare sit in front — trust forwarded headers.
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

builder.Services.AddHttpClient("FerrySchedule", client =>
{
    client.Timeout = TimeSpan.FromSeconds(15);
    client.DefaultRequestHeaders.UserAgent.ParseAdd("FerryFlightPWA/1.0");
});

builder.Services.AddHttpClient("OpenRouteService", client =>
{
    client.Timeout = TimeSpan.FromSeconds(15);
    client.DefaultRequestHeaders.UserAgent.ParseAdd("FerryFlightPWA/1.0");
});

builder.Services.AddScoped<IFerryScheduleScraper, FerryScheduleScraper>();
builder.Services.AddScoped<IFerryScheduleCache, FerryScheduleCache>();
builder.Services.AddScoped<ITravelTimeService, TravelTimeService>();

var corsOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>()
    ?.Where(origin => !string.IsNullOrWhiteSpace(origin))
    .ToArray() ?? [];

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        if (corsOrigins.Length > 0)
        {
            policy.WithOrigins(corsOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    });
});

var schedulesPermitLimit = builder.Configuration.GetValue("RateLimiting:SchedulesPermitLimit", 60);
var estimationPermitLimit = builder.Configuration.GetValue("RateLimiting:EstimationPermitLimit", 20);
var globalPermitLimit = builder.Configuration.GetValue("RateLimiting:GlobalPermitLimit", 120);
var windowSeconds = builder.Configuration.GetValue("RateLimiting:WindowSeconds", 60);
var rateLimitWindow = TimeSpan.FromSeconds(Math.Max(1, windowSeconds));

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsJsonAsync(
            new { message = "Too many requests. Please try again later." },
            cancellationToken);
    };

    options.AddPolicy("schedules", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            GetClientIp(httpContext),
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = schedulesPermitLimit,
                Window = rateLimitWindow,
                QueueLimit = 0,
            }));

    options.AddPolicy("estimation", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            GetClientIp(httpContext),
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = estimationPermitLimit,
                Window = rateLimitWindow,
                QueueLimit = 0,
            }));

    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            GetClientIp(httpContext),
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = globalPermitLimit,
                Window = rateLimitWindow,
                QueueLimit = 0,
            }));
});

var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrWhiteSpace(port))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}

var app = builder.Build();

app.UseForwardedHeaders();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors();
app.UseRateLimiter();
app.UseAuthorization();
app.MapControllers();

app.Run();

static string GetClientIp(HttpContext context)
{
    // Prefer Cloudflare's real-client header when proxied.
    var cfConnectingIp = context.Request.Headers["CF-Connecting-IP"].FirstOrDefault();
    if (!string.IsNullOrWhiteSpace(cfConnectingIp))
    {
        return cfConnectingIp.Trim();
    }

    var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
    if (!string.IsNullOrWhiteSpace(forwardedFor))
    {
        return forwardedFor.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)[0];
    }

    return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
}
