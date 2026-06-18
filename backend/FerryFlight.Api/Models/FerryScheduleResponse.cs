namespace FerryFlight.Api.Models;

public record FerryScheduleResponse(
    DateTimeOffset FetchedAt,
    IReadOnlyList<DaySchedule> Days);
