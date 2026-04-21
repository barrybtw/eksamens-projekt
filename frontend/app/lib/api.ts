const BASE = "http://localhost:5110";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    let message = "Noget gik galt.";
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
