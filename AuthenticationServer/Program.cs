using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173", "http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromHours(2);
    options.Cookie.Name = ".auth.session";
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
});

builder.Services.AddOpenApi();

// PostgreSQL via Entity Framework Core
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// Opret databasetabeller automatisk ved opstart
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("Frontend");
app.UseSession();

app.MapPost("/register", async (RegisterRequest req, AppDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
        return Results.BadRequest(new { error = "Brugernavn og kodeord er påkrævet." });

    if (req.Username.Length < 3)
        return Results.BadRequest(new { error = "Brugernavn skal være mindst 3 tegn." });

    if (req.Password.Length < 6)
        return Results.BadRequest(new { error = "Kodeord skal være mindst 6 tegn." });

    var exists = await db.Users.AnyAsync(u => u.Username.ToLower() == req.Username.ToLower());
    if (exists)
        return Results.Conflict(new { error = "Brugernavnet er allerede taget." });

    var hash = BCrypt.Net.BCrypt.HashPassword(req.Password, workFactor: 12);
    db.Users.Add(new User { Username = req.Username, PasswordHash = hash });
    await db.SaveChangesAsync();

    return Results.Ok(new { message = "Bruger oprettet." });
});

app.MapPost("/login", async (LoginRequest req, AppDbContext db, HttpContext ctx) =>
{
    var user = await db.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == req.Username.ToLower());
    if (user is null)
        return Results.Json(new { error = "Bruger findes ikke." }, statusCode: 401);

    if (!BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
        return Results.Json(new { error = "Forkert brugernavn eller kodeord." }, statusCode: 401);

    ctx.Session.SetString("username", user.Username);

    return Results.Ok(new { message = "Logget ind.", username = user.Username });
});

app.MapPost("/logout", (HttpContext ctx) =>
{
    ctx.Session.Clear();
    return Results.Ok(new { message = "Logget ud." });
});

app.MapGet("/me", (HttpContext ctx) =>
{
    var username = ctx.Session.GetString("username");
    if (username is null) return Results.Unauthorized();
    return Results.Ok(new { username });
});

app.MapPut("/change-password", async (ChangePasswordRequest req, AppDbContext db, HttpContext ctx) =>
{
    var username = ctx.Session.GetString("username");
    if (username is null) return Results.Unauthorized();

    var user = await db.Users.FirstOrDefaultAsync(u => u.Username == username);
    if (user is null) return Results.NotFound(new { error = "Bruger ikke fundet." });

    if (!BCrypt.Net.BCrypt.Verify(req.CurrentPassword, user.PasswordHash))
        return Results.BadRequest(new { error = "Nuværende kodeord er forkert." });

    if (req.NewPassword.Length < 6)
        return Results.BadRequest(new { error = "Nyt kodeord skal være mindst 6 tegn." });

    user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword, workFactor: 12);
    await db.SaveChangesAsync();

    return Results.Ok(new { message = "Kodeord ændret." });
});

app.MapDelete("/delete-account", async (AppDbContext db, HttpContext ctx) =>
{
    var username = ctx.Session.GetString("username");
    if (username is null) return Results.Unauthorized();

    var user = await db.Users.FirstOrDefaultAsync(u => u.Username == username);
    if (user is not null)
    {
        db.Users.Remove(user);
        await db.SaveChangesAsync();
    }

    ctx.Session.Clear();

    return Results.Ok(new { message = "Bruger slettet." });
});

app.Run();

class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();
    }
}

class User
{
    public int Id { get; set; }
    public string Username { get; set; } = "";
    public string PasswordHash { get; set; } = "";
}

record RegisterRequest(string Username, string Password);
record LoginRequest(string Username, string Password);
record ChangePasswordRequest(string CurrentPassword, string NewPassword);
