namespace FerryFlight.Api.Models;

public record DaySchedule(
    string DayLabel,
    string DateLabel,
    string Date,
    IReadOnlyList<RouteSchedule> Routes);
