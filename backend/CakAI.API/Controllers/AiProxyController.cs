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

    public record GenerateRequest(
        string? Prompt = null,
        int MaxTokens = 50,
        float Temperature = 0.8f,
        string? Model = null,
        string? Action = null,
        JsonElement? Params = null
    );

    [HttpPost("generate")]
    public async Task<IActionResult> Generate(GenerateRequest req)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        var model = req.Model ?? "ourllm";
        var action = req.Action ?? "generate";

        object jobParams;
        if (req.Params.HasValue && req.Params.Value.ValueKind == JsonValueKind.Object)
        {
            jobParams = req.Params.Value;
        }
        else
        {
            jobParams = new
            {
                prompt = req.Prompt ?? "",
                max_tokens = req.MaxTokens,
                temperature = req.Temperature,
            };
        }

        var submitPayload = JsonSerializer.Serialize(new
        {
            model,
            action,
            @params = jobParams,
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

                var modelName = model;
                var tokensUsed = 0;
                if (result.TryGetProperty("model", out var modelProp))
                    modelName = modelProp.GetString() ?? model;
                if (result.TryGetProperty("tokens_generated", out var tokensProp))
                    tokensUsed = tokensProp.GetInt32();

                _db.ApiUsageLogs.Add(new ApiUsageLog
                {
                    UserId = userId,
                    Endpoint = "/api/ai/generate",
                    ModelName = modelName,
                    TokensUsed = tokensUsed,
                });
                await _db.SaveChangesAsync();

                using var resultDoc = JsonDocument.Parse(result.GetRawText());
                var dict = JsonSerializer.Deserialize<Dictionary<string, object>>(result.GetRawText())
                           ?? new Dictionary<string, object>();
                dict["job_id"] = jobId;
                return Ok(dict);
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
