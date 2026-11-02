using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CakAI.API.Data;

namespace CakAI.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class UsageController : ControllerBase
{
    private readonly AppDbContext _db;

    public UsageController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMyUsage()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var since = DateTime.UtcNow.AddDays(-30);

        var logs = await _db.ApiUsageLogs
            .Where(l => l.UserId == userId && l.CreatedAt >= since)
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new
            {
                l.Endpoint,
                l.ModelName,
                l.TokensUsed,
                l.CreatedAt,
            })
            .Take(100)
            .ToListAsync();

        var totalCalls = await _db.ApiUsageLogs
            .CountAsync(l => l.UserId == userId);

        var todayCalls = await _db.ApiUsageLogs
            .CountAsync(l => l.UserId == userId && l.CreatedAt >= DateTime.UtcNow.Date);

        return Ok(new { todayCalls, totalCalls, recentLogs = logs });
    }
}
