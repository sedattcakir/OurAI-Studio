using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CakAI.API.Data;
using CakAI.API.Models;

namespace CakAI.API.Controllers;

[Authorize]
[ApiController]
[Route("api/ai")]
public class AiProxyController : ControllerBase
{
    private readonly HttpClient _http;
    private readonly AppDbContext _db;
    private readonly string _aiServiceUrl;

    public AiProxyController(HttpClient http, AppDbContext db, IConfiguration config)
    {
        _http = http;
        _db = db;
        _aiServiceUrl = config["AiService:BaseUrl"] ?? "http://localhost:8000";
    }

    public record GenerateRequest(string Prompt, int MaxTokens = 50, float Temperature = 0.8f);

    [HttpPost("generate")]
    public async Task<IActionResult> Generate(GenerateRequest req)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        var payload = JsonSerializer.Serialize(new
        {
            prompt = req.Prompt,
            max_tokens = req.MaxTokens,
            temperature = req.Temperature,
        });

        var content = new StringContent(payload, Encoding.UTF8, "application/json");
        var response = await _http.PostAsync($"{_aiServiceUrl}/llm/generate", content);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            return StatusCode((int)response.StatusCode, error);
        }

        var result = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(result);
        var tokensGenerated = json.RootElement.GetProperty("tokens_generated").GetInt32();

        _db.ApiUsageLogs.Add(new ApiUsageLog
        {
            UserId = userId,
            Endpoint = "/api/ai/generate",
            ModelName = "OurLLM-v0.2",
            TokensUsed = tokensGenerated,
        });
        await _db.SaveChangesAsync();

        return Content(result, "application/json");
    }
}
