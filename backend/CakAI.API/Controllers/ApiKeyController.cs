using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CakAI.API.Data;
using CakAI.API.Models;

namespace CakAI.API.Controllers;

[Authorize]
[ApiController]
[Route("api/keys")]
public class ApiKeyController : ControllerBase
{
    private readonly AppDbContext _db;

    public ApiKeyController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> ListKeys()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var keys = await _db.ApiKeys
            .Where(k => k.UserId == userId)
            .OrderByDescending(k => k.CreatedAt)
            .Select(k => new { k.Id, k.Name, k.KeyPrefix, k.CreatedAt, k.LastUsedAt, k.IsActive })
            .ToListAsync();
        return Ok(keys);
    }

    public record CreateKeyRequest(string Name);

    [HttpPost]
    public async Task<IActionResult> CreateKey(CreateKeyRequest req)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        var keyCount = await _db.ApiKeys.CountAsync(k => k.UserId == userId && k.IsActive);
        if (keyCount >= 5)
            return BadRequest(new { error = "Maximum 5 active API keys allowed." });

        var rawKey = $"cak_{Convert.ToHexString(RandomNumberGenerator.GetBytes(24)).ToLower()}";
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawKey))).ToLower();

        var apiKey = new ApiKey
        {
            UserId = userId,
            KeyHash = hash,
            KeyPrefix = rawKey[..12],
            Name = req.Name,
        };

        _db.ApiKeys.Add(apiKey);
        await _db.SaveChangesAsync();

        return Ok(new { apiKey.Id, apiKey.Name, apiKey.KeyPrefix, apiKey.CreatedAt, key = rawKey });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> RevokeKey(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var key = await _db.ApiKeys.FirstOrDefaultAsync(k => k.Id == id && k.UserId == userId);
        if (key == null) return NotFound();

        key.IsActive = false;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Key revoked." });
    }
}
