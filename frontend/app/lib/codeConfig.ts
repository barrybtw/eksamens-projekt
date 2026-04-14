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
    'app.MapPost("/login", (LoginRequest req, HttpContext ctx) =>',
    '{',
    '    if (!users.TryGetValue(req.Username, out var user))',
    '        return Results.Unauthorized();',
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
    [9],
    [9],
    [9],
    [11],
  ],
  errorHighlights: [4, 7],
};

export const registerCode: CodeConfig = {
  fileName: "Program.cs",
  lines: [
    '// POST /register',
    'app.MapPost("/register", (RegisterRequest req, HttpContext ctx) =>',
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
    '    var hash = BCrypt.Net.BCrypt.HashPassword(req.Password, workFactor: 12);',
    '',
    '    if (!users.TryAdd(req.Username, new StoredUser(req.Username, hash)))',
    '        return Results.Conflict(new { error = "Brugernavnet er allerede taget." });',
    '',
    '    return Results.Ok(new { message = "Bruger oprettet." });',
    '});',
  ],
  pendingHighlights: [
    [1],
    [3, 6, 9],
    [12],
    [14],
  ],
  successHighlights: [
    [14],
    [17],
    [17],
  ],
  errorHighlights: [4, 7, 10, 15],
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
    [3],
    [3],
  ],
  successHighlights: [
    [3],
    [4],
  ],
  errorHighlights: [1],
};

export const changePasswordCode: CodeConfig = {
  fileName: "Program.cs",
  lines: [
    '// PUT /change-password',
    'app.MapPut("/change-password", (ChangePasswordRequest req, HttpContext ctx) =>',
    '{',
    '    var username = ctx.Session.GetString("username");',
    '    if (username is null) return Results.Unauthorized();',
    '',
    '    if (!users.TryGetValue(username, out var user))',
    '        return Results.NotFound(new { error = "Bruger ikke fundet." });',
    '',
    '    if (!BCrypt.Net.BCrypt.Verify(req.CurrentPassword, user.PasswordHash))',
    '        return Results.BadRequest(new { error = "Nuværende kodeord er forkert." });',
    '',
    '    if (req.NewPassword.Length < 6)',
    '        return Results.BadRequest(new { error = "Nyt kodeord skal være mindst 6 tegn." });',
    '',
    '    var newHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword, workFactor: 12);',
    '    users[username] = user with { PasswordHash = newHash };',
    '',
    '    return Results.Ok(new { message = "Kodeord ændret." });',
    '});',
  ],
  pendingHighlights: [
    [1],
    [3, 4],
    [9],
    [9, 10],
  ],
  successHighlights: [
    [15],
    [16],
    [18],
  ],
  errorHighlights: [4, 10, 13],
};

export const deleteCode: CodeConfig = {
  fileName: "Program.cs",
  lines: [
    '// DELETE /delete-account',
    'app.MapDelete("/delete-account", (HttpContext ctx) =>',
    '{',
    '    var username = ctx.Session.GetString("username");',
    '    if (username is null) return Results.Unauthorized();',
    '',
    '    users.TryRemove(username, out _);',
    '    ctx.Session.Clear();',
    '',
    '    return Results.Ok(new { message = "Bruger slettet." });',
    '});',
  ],
  pendingHighlights: [
    [1],
    [3, 4],
    [6],
  ],
  successHighlights: [
    [7],
    [9],
  ],
  errorHighlights: [4],
};
