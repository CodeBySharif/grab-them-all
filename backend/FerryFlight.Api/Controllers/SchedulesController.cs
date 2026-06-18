using FerryFlight.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace FerryFlight.Api.Controllers;

[ApiController]
[Route("api/schedules")]
public class SchedulesController(IFerryScheduleCache scheduleCache) : ControllerBase
{
    [HttpGet("ferry")]
    public async Task<IActionResult> GetFerrySchedules(CancellationToken cancellationToken)
    {
        try
        {
            var schedules = await scheduleCache.GetSchedulesAsync(cancellationToken);
            return Ok(schedules);
        }
        catch (Exception)
        {
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new { message = "Unable to fetch ferry schedules. Please try again later." });
        }
    }
}
