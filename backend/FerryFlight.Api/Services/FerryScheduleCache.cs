using FerryFlight.Api.Models;
using Microsoft.Extensions.Caching.Memory;

namespace FerryFlight.Api.Services;

public class FerryScheduleCache(
    IMemoryCache memoryCache,
    IFerryScheduleScraper scraper,
    IConfiguration configuration,
    ILogger<FerryScheduleCache> logger) : IFerryScheduleCache
{
    private const string CacheKey = "ferry-schedules";
    private readonly object _staleLock = new();
    private FerryScheduleResponse? _staleResponse;

    public async Task<FerryScheduleResponse> GetSchedulesAsync(CancellationToken cancellationToken = default)
    {
        if (memoryCache.TryGetValue(CacheKey, out FerryScheduleResponse? cached) && cached is not null)
        {
            return cached;
        }

        try
        {
            var days = await scraper.ScrapeAsync(cancellationToken);
            var response = new FerryScheduleResponse(DateTimeOffset.UtcNow, days);

            var ttlMinutes = configuration.GetValue("FerrySchedule:CacheMinutes", 30);

            memoryCache.Set(CacheKey, response, TimeSpan.FromMinutes(ttlMinutes));

            lock (_staleLock)
            {
                _staleResponse = response;
            }

            return response;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to fetch ferry schedules");

            lock (_staleLock)
            {
                if (_staleResponse is not null)
                {
                    logger.LogWarning("Returning stale ferry schedule cache");
                    return _staleResponse;
                }
            }

            throw;
        }
    }
}
