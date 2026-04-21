const BASE = "http://localhost:5110";

function fallbackMessage(status: number): string {
  if (status === 400) return "Ugyldigt input.";
  if (status === 401) return "Ikke autoriseret.";
  if (status === 403) return "Adgang nægtet.";
  if (status === 404) return "Ressourcen blev ikke fundet.";
  if (status === 409) return "Konflikt — ressourcen eksisterer allerede.";
  if (status >= 500) return "Serverfejl. Prøv igen senere.";
  return "Ukendt fejl.";
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    let message = fallbackMessage(res.status);
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {}
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export const api = {
  me: () => request<{ username: string }>("/me"),

  register: (username: string, password: string) =>
    request<{ message: string }>("/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  login: (username: string, password: string) =>
    request<{ message: string; username: string }>("/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  logout: () => request<{ message: string }>("/logout", { method: "POST" }),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ message: string }>("/change-password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  deleteAccount: () =>
    request<{ message: string }>("/delete-account", { method: "DELETE" }),
};
