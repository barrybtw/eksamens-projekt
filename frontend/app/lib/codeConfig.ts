export type CodeConfig = {
  fileName: string;
  lines: string[];
  // Hvilke linjenumre (0-indekseret) der fremhæves for hvert ventende trin
  pendingHighlights: number[][];
  // Hvilke linjenumre der fremhæves for hvert succestrin
  successHighlights: number[][];
  // Hvilke linjer der fremhæves når der opstår en fejl
  errorHighlights: number[];
};

export const loginCode: CodeConfig = {
  fileName: "Program.cs",
  lines: [
    '// POST /login',
    'app.MapPost("/login", async (LoginRequest req, AppDbContext db, HttpContext ctx) =>',
    '{',
    '    var user = await db.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == req.Username.ToLower());',
    '    if (user is null) return Results.Unauthorized();',
    '',
    '    if (!BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))',
    '        return Results.Unauthorized();',
    '',
    '    ctx.Session.SetString("username", user.Username);',
    '',
    '    return Results.Ok(new { message = "Logget ind.", username = user.Username });',
    '});',
  ],
  pendingHighlights: [
    [1],
    [3, 4],
    [6, 7],
  ],
  successHighlights: [
    [6],
    [9],
    [11],
    [11],
  ],
  errorHighlights: [3, 4, 6, 7],
};

export const registerCode: CodeConfig = {
  fileName: "Program.cs",
  lines: [
    '// POST /register',
    'app.MapPost("/register", async (RegisterRequest req, AppDbContext db) =>',
    '{',
    '    if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))',
    '        return Results.BadRequest(new { error = "Brugernavn og kodeord er påkrævet." });',
    '',
    '    if (req.Username.Length < 3)',
    '        return Results.BadRequest(new { error = "Brugernavn skal være mindst 3 tegn." });',
    '',
    '    if (req.Password.Length < 6)',
    '        return Results.BadRequest(new { error = "Kodeord skal være mindst 6 tegn." });',
    '',
    '    var exists = await db.Users.AnyAsync(u => u.Username.ToLower() == req.Username.ToLower());',
    '    if (exists)',
    '        return Results.Conflict(new { error = "Brugernavnet er allerede taget." });',
    '',
    '    var hash = BCrypt.Net.BCrypt.HashPassword(req.Password, workFactor: 12);',
    '    db.Users.Add(new User { Username = req.Username, PasswordHash = hash });',
    '    await db.SaveChangesAsync();',
    '',
    '    return Results.Ok(new { message = "Bruger oprettet." });',
    '});',
  ],
  pendingHighlights: [
    [1],
    [3, 4],
    [6, 7],
    [9, 10],
    [12, 13],
    [16],
  ],
  successHighlights: [
    [12, 13],
    [17, 18],
    [20],
  ],
  errorHighlights: [3, 4, 6, 7, 9, 10, 13, 14],
};

export const logoutCode: CodeConfig = {
  fileName: "Program.cs",
  lines: [
    '// POST /logout',
    'app.MapPost("/logout", (HttpContext ctx) =>',
    '{',
    '    ctx.Session.Clear();',
    '    return Results.Ok(new { message = "Logget ud." });',
    '});',
  ],
  pendingHighlights: [
    [1],
    [1],
    [3],
  ],
  successHighlights: [
    [3],
    [4],
  ],
  errorHighlights: [3],
};

export const changePasswordCode: CodeConfig = {
  fileName: "Program.cs",
  lines: [
    '// PUT /change-password',
    'app.MapPut("/change-password", async (ChangePasswordRequest req, AppDbContext db, HttpContext ctx) =>',
    '{',
    '    var username = ctx.Session.GetString("username");',
    '    if (username is null) return Results.Unauthorized();',
    '',
    '    var user = await db.Users.FirstOrDefaultAsync(u => u.Username == username);',
    '    if (user is null) return Results.NotFound(new { error = "Bruger ikke fundet." });',
    '',
    '    if (!BCrypt.Net.BCrypt.Verify(req.CurrentPassword, user.PasswordHash))',
    '        return Results.BadRequest(new { error = "Nuværende kodeord er forkert." });',
    '',
    '    if (req.NewPassword.Length < 6)',
    '        return Results.BadRequest(new { error = "Nyt kodeord skal være mindst 6 tegn." });',
    '',
    '    user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword, workFactor: 12);',
    '    await db.SaveChangesAsync();',
    '',
    '    return Results.Ok(new { message = "Kodeord ændret." });',
    '});',
  ],
  pendingHighlights: [
    [1],
    [3, 4],
    [6, 7],
    [9, 10],
    [12, 13],
  ],
  successHighlights: [
    [15],
    [16],
    [18],
  ],
  errorHighlights: [3, 4, 6, 7, 9, 10, 12, 13],
};

export const deleteCode: CodeConfig = {
  fileName: "Program.cs",
  lines: [
    '// DELETE /delete-account',
    'app.MapDelete("/delete-account", async (AppDbContext db, HttpContext ctx) =>',
    '{',
    '    var username = ctx.Session.GetString("username");',
    '    if (username is null) return Results.Unauthorized();',
    '',
    '    var user = await db.Users.FirstOrDefaultAsync(u => u.Username == username);',
    '    if (user is not null)',
    '    {',
    '        db.Users.Remove(user);',
    '        await db.SaveChangesAsync();',
    '    }',
    '',
    '    ctx.Session.Clear();',
    '',
    '    return Results.Ok(new { message = "Bruger slettet." });',
    '});',
  ],
  pendingHighlights: [
    [1],
    [3, 4],
    [6, 7, 9, 10],
  ],
  successHighlights: [
    [13],
    [15],
  ],
  errorHighlights: [3, 4],
};
