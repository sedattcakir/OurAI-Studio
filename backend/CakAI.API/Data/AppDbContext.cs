using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using CakAI.API.Models;

namespace CakAI.API.Data;

public class AppDbContext : IdentityDbContext<AppUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<ApiUsageLog> ApiUsageLogs => Set<ApiUsageLog>();
    public DbSet<ApiKey> ApiKeys => Set<ApiKey>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<ApiUsageLog>(e =>
        {
            e.HasIndex(l => l.UserId);
            e.HasIndex(l => l.CreatedAt);
            e.HasOne(l => l.User)
             .WithMany()
             .HasForeignKey(l => l.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<ApiKey>(e =>
        {
            e.HasIndex(k => k.UserId);
            e.HasIndex(k => k.KeyHash);
            e.HasOne(k => k.User)
             .WithMany()
             .HasForeignKey(k => k.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
