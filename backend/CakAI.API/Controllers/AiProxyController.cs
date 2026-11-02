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

        var submitPayload = JsonSerializer.Serialize(new
        {
            model = "ourllm",
            action = "generate",
            @params = new
            {
                prompt = req.Prompt,
                max_tokens = req.MaxTokens,
                temperature = req.Temperature,
            },
        });

        var submitContent = new StringContent(submitPayload, Encoding.UTF8, "application/json");
        var submitResponse = await _http.PostAsync($"{_aiServiceUrl}/jobs/submit", submitContent);

        if (!submitResponse.IsSuccessStatusCode)
        {
            var error = await submitResponse.Content.ReadAsStringAsync();
            return StatusCode((int)submitResponse.StatusCode, error);
        }

        var submitResult = JsonDocument.Parse(await submitResponse.Content.ReadAsStringAsync());
        var jobId = submitResult.RootElement.GetProperty("id").GetString()!;

        for (var i = 0; i < 60; i++)
        {
            await Task.Delay(500);
            var statusResponse = await _http.GetAsync($"{_aiServiceUrl}/jobs/{jobId}");
            var statusJson = JsonDocument.Parse(await statusResponse.Content.ReadAsStringAsync());
            var status = statusJson.RootElement.GetProperty("status").GetString();

            if (status == "completed")
            {
                var result = statusJson.RootElement.GetProperty("result");
                var tokensGenerated = result.GetProperty("tokens_generated").GetInt32();

                _db.ApiUsageLogs.Add(new ApiUsageLog
                {
                    UserId = userId,
                    Endpoint = "/api/ai/generate",
                    ModelName = "OurLLM-v0.2",
                    TokensUsed = tokensGenerated,
                });
                await _db.SaveChangesAsync();

                return Ok(new
                {
                    generated_text = result.GetProperty("generated_text").GetString(),
                    model = result.GetProperty("model").GetString(),
                    tokens_generated = tokensGenerated,
                    job_id = jobId,
                });
            }

            if (status == "failed")
            {
                var errorMsg = statusJson.RootElement.GetProperty("error").GetString();
                return StatusCode(500, new { error = errorMsg, job_id = jobId });
            }
        }

        return StatusCode(408, new { error = "Job timed out", job_id = jobId });
    }

    [HttpGet("job/{jobId}")]
    public async Task<IActionResult> GetJobStatus(string jobId)
    {
        var response = await _http.GetAsync($"{_aiServiceUrl}/jobs/{jobId}");
        var result = await response.Content.ReadAsStringAsync();
        return Content(result, "application/json");
    }
}
