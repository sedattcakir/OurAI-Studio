using Microsoft.AspNetCore.Identity;

namespace CakAI.API.Models;

public class AppUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int ApiCallsToday { get; set; }
    public int TotalApiCalls { get; set; }
}
