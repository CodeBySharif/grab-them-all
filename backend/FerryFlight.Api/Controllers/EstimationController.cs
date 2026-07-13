using FerryFlight.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace FerryFlight.Api.Controllers;

[ApiController]
[Route("api/estimation")]
[EnableRateLimiting("estimation")]
public class EstimationController(ITravelTimeService travelTimeService) : ControllerBase
{
    [HttpGet("travel-times")]
    public async Task<IActionResult> GetTravelTimes(
        [FromQuery] double latitude,
        [FromQuery] double longitude,
        CancellationToken cancellationToken)
    {
        if (latitude is < -90 or > 90 || longitude is < -180 or > 180)
        {
            return BadRequest(new { message = "Invalid coordinates." });
        }

        try
        {
            var result = await travelTimeService.GetTravelTimesAsync(
                latitude,
                longitude,
                cancellationToken);

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new { message = "Unable to fetch travel times. Please try again." });
        }
    }
}
