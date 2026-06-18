using FerryFlight.Api.Models;

namespace FerryFlight.Api.Services;

public interface IFerryScheduleScraper
{
    Task<IReadOnlyList<DaySchedule>> ScrapeAsync(CancellationToken cancellationToken = default);
}
