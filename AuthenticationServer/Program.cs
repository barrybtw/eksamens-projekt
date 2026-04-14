using System.Collections.Concurrent;

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

// Trådsikker in-memory brugerdatabase (brugernavn → StoredUser)
var users = new ConcurrentDictionary<string, StoredUser>(StringComparer.OrdinalIgnoreCase);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("Frontend");
app.UseSession();

app.MapPost("/register", (RegisterRequest req, HttpContext ctx) =>
{
    if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
        return Results.BadRequest(new { error = "Brugernavn og kodeord er påkrævet." });

    if (req.Username.Length < 3)
        return Results.BadRequest(new { error = "Brugernavn skal være mindst 3 tegn." });

    if (req.Password.Length < 6)
        return Results.BadRequest(new { error = "Kodeord skal være mindst 6 tegn." });

    var hash = BCrypt.Net.BCrypt.HashPassword(req.Password, workFactor: 12);

    if (!users.TryAdd(req.Username, new StoredUser(req.Username, hash)))
        return Results.Conflict(new { error = "Brugernavnet er allerede taget." });

    return Results.Ok(new { message = "Bruger oprettet." });
});

app.MapPost("/login", (LoginRequest req, HttpContext ctx) =>
{
    if (!users.TryGetValue(req.Username, out var user))
        return Results.Unauthorized();

    if (!BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
        return Results.Unauthorized();

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

app.MapPut("/change-password", (ChangePasswordRequest req, HttpContext ctx) =>
{
    var username = ctx.Session.GetString("username");
    if (username is null) return Results.Unauthorized();

    if (!users.TryGetValue(username, out var user))
        return Results.NotFound(new { error = "Bruger ikke fundet." });

    if (!BCrypt.Net.BCrypt.Verify(req.CurrentPassword, user.PasswordHash))
        return Results.BadRequest(new { error = "Nuværende kodeord er forkert." });

    if (req.NewPassword.Length < 6)
        return Results.BadRequest(new { error = "Nyt kodeord skal være mindst 6 tegn." });

    var newHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword, workFactor: 12);
    users[username] = user with { PasswordHash = newHash };

    return Results.Ok(new { message = "Kodeord ændret." });
});

app.MapDelete("/delete-account", (HttpContext ctx) =>
{
    var username = ctx.Session.GetString("username");
    if (username is null) return Results.Unauthorized();

    users.TryRemove(username, out _);
    ctx.Session.Clear();

    return Results.Ok(new { message = "Bruger slettet." });
});

app.Run();

record StoredUser(string Username, string PasswordHash);
record RegisterRequest(string Username, string Password);
record LoginRequest(string Username, string Password);
record ChangePasswordRequest(string CurrentPassword, string NewPassword);
