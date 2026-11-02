using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CakAI.API.Data;
using CakAI.API.Models;

namespace CakAI.API.Controllers;

[Authorize]
[ApiController]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;
    private readonly AppDbContext _db;

    public AdminController(UserManager<AppUser> userManager, AppDbContext db)
    {
        _userManager = userManager;
        _db = db;
    }

    private async Task<bool> IsAdmin()
    {
        var user = await _userManager.FindByIdAsync(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        return user?.IsAdmin == true;
    }

    [HttpGet("users")]
    public async Task<IActionResult> ListUsers()
    {
        if (!await IsAdmin()) return Forbid();

        var users = await _userManager.Users
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new
            {
                u.Id,
                u.FullName,
                u.Email,
                tier = u.SubscriptionTier,
                u.ApiCallsToday,
                totalCalls = u.TotalApiCalls,
                u.DailyApiLimit,
                u.CreatedAt,
                u.IsAdmin,
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        if (!await IsAdmin()) return Forbid();

        var totalUsers = await _userManager.Users.CountAsync();
        var todayCalls = await _userManager.Users.SumAsync(u => u.ApiCallsToday);
        var totalCalls = await _userManager.Users.SumAsync(u => u.TotalApiCalls);

        var tierBreakdown = await _userManager.Users
            .GroupBy(u => u.SubscriptionTier)
            .Select(g => new { tier = g.Key, count = g.Count() })
            .ToListAsync();

        var recentLogs = await _db.ApiUsageLogs
            .OrderByDescending(l => l.CreatedAt)
            .Take(20)
            .Select(l => new { l.ModelName, l.TokensUsed, l.CreatedAt })
            .ToListAsync();

        return Ok(new { totalUsers, todayCalls, totalCalls, tierBreakdown, recentLogs });
    }
}
