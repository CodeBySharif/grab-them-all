namespace FerryFlight.Api.Services;

internal static class HaversineTravelEstimator
{
    private const double EarthRadiusKm = 6371.0;
    private const double RoadFactor = 1.35;
    private const double AverageSpeedKmh = 45.0;

    public static double EstimateRoadMeters(
        double originLat,
        double originLng,
        double destLat,
        double destLng)
    {
        var distanceKm = HaversineKm(originLat, originLng, destLat, destLng);
        return distanceKm * RoadFactor * 1000.0;
    }

    public static int EstimateDurationSeconds(
        double originLat,
        double originLng,
        double destLat,
        double destLng)
    {
        var roadKm = EstimateRoadMeters(originLat, originLng, destLat, destLng) / 1000.0;
        return (int)Math.Ceiling(roadKm / AverageSpeedKmh * 3600);
    }

    public static string FormatDuration(int totalSeconds)
    {
        if (totalSeconds < 60)
        {
            return "about 1 min";
        }

        var minutes = (int)Math.Round(totalSeconds / 60.0);
        return minutes switch
        {
            < 60 => $"about {minutes} min",
            _ => $"about {minutes / 60} hr {minutes % 60} min",
        };
    }

    public static string FormatDistance(double meters)
    {
        if (meters < 1000)
        {
            return $"{(int)Math.Round(meters)} m";
        }

        var km = meters / 1000.0;
        return km >= 10
            ? $"{km:0} km"
            : $"{km:0.#} km";
    }

    private static double HaversineKm(
        double lat1,
        double lng1,
        double lat2,
        double lng2)
    {
        var dLat = DegreesToRadians(lat2 - lat1);
        var dLng = DegreesToRadians(lng2 - lng1);
        var a =
            Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
            Math.Cos(DegreesToRadians(lat1)) * Math.Cos(DegreesToRadians(lat2)) *
            Math.Sin(dLng / 2) * Math.Sin(dLng / 2);

        return EarthRadiusKm * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }

    private static double DegreesToRadians(double degrees) =>
        degrees * Math.PI / 180.0;
}
