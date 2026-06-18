using System.Globalization;
using System.Text.RegularExpressions;
using FerryFlight.Api.Models;
using HtmlAgilityPack;

namespace FerryFlight.Api.Services;

public partial class FerryScheduleScraper(IHttpClientFactory httpClientFactory, ILogger<FerryScheduleScraper> logger)
    : IFerryScheduleScraper
{
    private const string ScheduleUrl = "https://ticket.langkawiferryline.com/index_ext.php?public_trip_info";
    private const int MaxDays = 3;

    public async Task<IReadOnlyList<DaySchedule>> ScrapeAsync(CancellationToken cancellationToken = default)
    {
        var client = httpClientFactory.CreateClient("FerrySchedule");
        var html = await client.GetStringAsync(ScheduleUrl, cancellationToken);

        var document = new HtmlDocument();
        document.LoadHtml(html);

        var tableNodes = document.DocumentNode.SelectNodes("//table[.//h5[contains(@class,'h5-date')]]");
        var tables = tableNodes is not null ? tableNodes.ToList() : [];

        var days = new List<DaySchedule>();

        foreach (var table in tables)
        {
            if (days.Count >= MaxDays)
            {
                break;
            }

            var dateNode = table.SelectSingleNode(".//h5[contains(@class,'h5-date')]");
            if (dateNode is null)
            {
                continue;
            }

            var dateText = HtmlEntity.DeEntitize(dateNode.InnerText).Trim();
            if (!TryParseDateHeader(dateText, out var dayLabel, out var dateLabel, out var isoDate))
            {
                logger.LogWarning("Skipping table with unparseable date header: {DateText}", dateText);
                continue;
            }

            var routeColumnNodes = table.SelectNodes(".//div[contains(@class,'div-daily')]");
            var routeColumns = routeColumnNodes is not null ? routeColumnNodes.ToList() : [];

            var routes = new List<RouteSchedule>();

            foreach (var column in routeColumns)
            {
                var childDivs = column.SelectNodes("./div");
                if (childDivs is null || childDivs.Count == 0)
                {
                    continue;
                }

                var routeName = HtmlEntity.DeEntitize(childDivs[0].InnerText).Trim();
                if (string.IsNullOrWhiteSpace(routeName))
                {
                    continue;
                }

                var trips = new List<Trip>();

                for (var i = 1; i < childDivs.Count; i++)
                {
                    var tripDiv = childDivs[i];
                    var timeNode = tripDiv.SelectSingleNode(".//strong");
                    if (timeNode is null)
                    {
                        continue;
                    }

                    var rawTime = HtmlEntity.DeEntitize(timeNode.InnerText).Trim();
                    var isExtraTrip = rawTime.EndsWith('*');
                    var departureTime = isExtraTrip ? rawTime.TrimEnd('*').Trim() : rawTime;

                    var vesselNode = tripDiv.SelectSingleNode(".//span[contains(@class,'text-primary')]");
                    var vesselName = vesselNode is not null
                        ? HtmlEntity.DeEntitize(vesselNode.InnerText).Trim()
                        : string.Empty;

                    var classAttr = tripDiv.GetAttributeValue("class", string.Empty);
                    var isClosed = classAttr.Contains("text-danger", StringComparison.OrdinalIgnoreCase);

                    trips.Add(new Trip(departureTime, vesselName, isExtraTrip, isClosed));
                }

                routes.Add(new RouteSchedule(routeName, trips));
            }

            if (routes.Count > 0)
            {
                days.Add(new DaySchedule(dayLabel, dateLabel, isoDate, routes));
            }
        }

        return days;
    }

    private static bool TryParseDateHeader(
        string dateText,
        out string dayLabel,
        out string dateLabel,
        out string isoDate)
    {
        dayLabel = string.Empty;
        dateLabel = string.Empty;
        isoDate = string.Empty;

        var match = DateHeaderRegex().Match(dateText);
        if (!match.Success)
        {
            return false;
        }

        dayLabel = match.Groups["day"].Value;
        var dayNumber = match.Groups["date"].Value;
        var month = match.Groups["month"].Value;
        var year = match.Groups["year"].Value;
        dateLabel = $"{dayNumber} {month} {year}";

        if (!DateTime.TryParseExact(
                $"{dayNumber} {month} {year}",
                "d MMM yyyy",
                CultureInfo.InvariantCulture,
                DateTimeStyles.None,
                out var parsedDate))
        {
            return false;
        }

        isoDate = parsedDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        return true;
    }

    [GeneratedRegex(@"^(?<day>[A-Z]{3})\s+(?<date>\d{1,2})\s+(?<month>[A-Z]{3})\s+(?<year>\d{4})$", RegexOptions.IgnoreCase)]
    private static partial Regex DateHeaderRegex();
}
