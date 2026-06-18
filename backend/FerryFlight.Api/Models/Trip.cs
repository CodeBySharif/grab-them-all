namespace FerryFlight.Api.Models;

public record Trip(
    string DepartureTime,
    string VesselName,
    bool IsExtraTrip,
    bool IsClosed);
