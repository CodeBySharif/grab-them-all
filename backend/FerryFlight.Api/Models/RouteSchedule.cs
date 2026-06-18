namespace FerryFlight.Api.Models;

public record RouteSchedule(string Name, IReadOnlyList<Trip> Trips);
