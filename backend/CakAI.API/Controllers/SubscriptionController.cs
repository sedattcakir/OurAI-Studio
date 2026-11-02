using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using CakAI.API.Models;

namespace CakAI.API.Controllers;

[Authorize]
[ApiController]
[Route("api/subscription")]
public class SubscriptionController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;

    private static readonly Dictionary<string, (int dailyLimit, decimal price)> Tiers = new()
    {
        ["free"] = (50, 0m),
        ["starter"] = (500, 19.99m),
        ["pro"] = (5000, 49.99m),
        ["enterprise"] = (int.MaxValue, 199.99m),
    };

    public SubscriptionController(UserManager<AppUser> userManager) => _userManager = userManager;

    [HttpGet]
    public async Task<IActionResult> GetSubscription()
    {
        var user = await _userManager.FindByIdAsync(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        if (user == null) return Unauthorized();

        return Ok(new
        {
            tier = user.SubscriptionTier,
            dailyLimit = user.DailyApiLimit,
            expiresAt = user.SubscriptionExpiresAt,
            todayCalls = user.ApiCallsToday,
            totalCalls = user.TotalApiCalls,
        });
    }

    [AllowAnonymous]
    [HttpGet("tiers")]
    public IActionResult GetTiers()
    {
        var tiers = Tiers.Select(t => new
        {
            name = t.Key,
            dailyLimit = t.Value.dailyLimit == int.MaxValue ? -1 : t.Value.dailyLimit,
            price = t.Value.price,
        });
        return Ok(tiers);
    }

    public record UpgradeRequest(string Tier);

    [HttpPost("upgrade")]
    public async Task<IActionResult> Upgrade(UpgradeRequest req)
    {
        if (!Tiers.ContainsKey(req.Tier))
            return BadRequest(new { error = "Invalid tier." });

        var user = await _userManager.FindByIdAsync(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        if (user == null) return Unauthorized();

        var (dailyLimit, _) = Tiers[req.Tier];
        user.SubscriptionTier = req.Tier;
        user.DailyApiLimit = dailyLimit;
        user.SubscriptionExpiresAt = req.Tier == "free" ? null : DateTime.UtcNow.AddDays(30);

        await _userManager.UpdateAsync(user);

        return Ok(new
        {
            message = $"Upgraded to {req.Tier}.",
            tier = user.SubscriptionTier,
            dailyLimit = user.DailyApiLimit,
            expiresAt = user.SubscriptionExpiresAt,
        });
    }
}
