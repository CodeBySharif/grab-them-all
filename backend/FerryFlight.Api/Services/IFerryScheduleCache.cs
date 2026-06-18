using FerryFlight.Api.Models;

namespace FerryFlight.Api.Services;

public interface IFerryScheduleCache
{
    Task<FerryScheduleResponse> GetSchedulesAsync(CancellationToken cancellationToken = default);
}
