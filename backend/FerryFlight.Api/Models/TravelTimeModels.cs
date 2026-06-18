namespace FerryFlight.Api.Models;

public record GeoPoint(double Latitude, double Longitude);

public record TravelTimeResult(
    int DurationSeconds,
    string DurationText,
    string Provider);

public record TravelTimesResponse(
    GeoPoint Destination,
    TravelTimeResult LangkawiTerminal);
