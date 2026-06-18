using System.Text.Json;
using FerryFlight.Api.Models;
using Microsoft.Extensions.Caching.Memory;

namespace FerryFlight.Api.Services;

public class TravelTimeService(
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration,
    IMemoryCache memoryCache,
    ILogger<TravelTimeService> logger) : ITravelTimeService
{
    private const string DirectionsUrl = "https://api.openrouteservice.org/v2/directions/driving-car";

    public async Task<TravelTimesResponse> GetTravelTimesAsync(
        double latitude,
        double longitude,
        CancellationToken cancellationToken = default)
    {
        var terminalLat = configuration.GetValue("TravelEstimation:LangkawiTerminal:Lat", 6.3197);
        var terminalLng = configuration.GetValue("TravelEstimation:LangkawiTerminal:Lng", 99.8431);
        var destination = new GeoPoint(terminalLat, terminalLng);

        var cacheKey = $"travel-{Math.Round(latitude, 3)}-{Math.Round(longitude, 3)}";
        if (memoryCache.TryGetValue(cacheKey, out TravelTimesResponse? cached) && cached is not null)
        {
            return cached;
        }

        var apiKey = configuration["OpenRouteService:ApiKey"];
        TravelTimeResult travelTime;

        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            try
            {
                travelTime = await FetchFromOpenRouteServiceAsync(
                    latitude,
                    longitude,
                    terminalLat,
                    terminalLng,
                    apiKey,
                    cancellationToken);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "OpenRouteService failed, falling back to haversine estimate");
                travelTime = BuildHaversineEstimate(latitude, longitude, terminalLat, terminalLng);
            }
        }
        else
        {
            travelTime = BuildHaversineEstimate(latitude, longitude, terminalLat, terminalLng);
        }

        var result = new TravelTimesResponse(destination, travelTime);
        memoryCache.Set(cacheKey, result, TimeSpan.FromMinutes(5));

        return result;
    }

    private async Task<TravelTimeResult> FetchFromOpenRouteServiceAsync(
        double originLat,
        double originLng,
        double destLat,
        double destLng,
        string apiKey,
        CancellationToken cancellationToken)
    {
        var client = httpClientFactory.CreateClient("OpenRouteService");
        var start = $"{originLng.ToString(System.Globalization.CultureInfo.InvariantCulture)},{originLat.ToString(System.Globalization.CultureInfo.InvariantCulture)}";
        var end = $"{destLng.ToString(System.Globalization.CultureInfo.InvariantCulture)},{destLat.ToString(System.Globalization.CultureInfo.InvariantCulture)}";

        var url =
            $"{DirectionsUrl}?api_key={Uri.EscapeDataString(apiKey)}" +
            $"&start={Uri.EscapeDataString(start)}&end={Uri.EscapeDataString(end)}";

        using var response = await client.GetAsync(url, cancellationToken);
        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

        var features = document.RootElement.GetProperty("features");
        if (features.GetArrayLength() == 0)
        {
            throw new InvalidOperationException("No route found.");
        }

        var durationSeconds = (int)Math.Ceiling(
            features[0].GetProperty("properties").GetProperty("summary").GetProperty("duration").GetDouble());

        return new TravelTimeResult(
            durationSeconds,
            HaversineTravelEstimator.FormatDuration(durationSeconds),
            "openrouteservice");
    }

    private static TravelTimeResult BuildHaversineEstimate(
        double originLat,
        double originLng,
        double destLat,
        double destLng)
    {
        var durationSeconds = HaversineTravelEstimator.EstimateDurationSeconds(
            originLat,
            originLng,
            destLat,
            destLng);

        return new TravelTimeResult(
            durationSeconds,
            HaversineTravelEstimator.FormatDuration(durationSeconds),
            "haversine");
    }
}
