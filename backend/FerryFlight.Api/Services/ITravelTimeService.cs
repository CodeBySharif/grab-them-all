using FerryFlight.Api.Models;

namespace FerryFlight.Api.Services;

public interface ITravelTimeService
{
    Task<TravelTimesResponse> GetTravelTimesAsync(
        double latitude,
        double longitude,
        CancellationToken cancellationToken = default);
}
