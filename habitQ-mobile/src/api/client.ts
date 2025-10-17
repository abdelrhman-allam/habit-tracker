// Simple API client for Next.js backend
export type LoginResult = { ok: boolean; error?: string };

const DEFAULT_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000";

export const api = {
  baseUrl: DEFAULT_BASE_URL,

  async getCsrfToken(): Promise<string | null> {
    try {
      const res = await fetch(`${api.baseUrl}/api/auth/csrf`, {
        method: "GET",
        // On web, include credentials so cookies are set if any
        credentials: "include",
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.csrfToken || null;
    } catch (e) {
      return null;
    }
  },

  async login(email: string, password: string): Promise<LoginResult> {
    try {
      const csrfToken = await api.getCsrfToken();
      const form = new URLSearchParams();
      if (csrfToken) form.append("csrfToken", csrfToken);
      form.append("email", email);
      form.append("password", password);
      // Credentials Provider callback endpoint
      const res = await fetch(`${api.baseUrl}/api/auth/callback/credentials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
        credentials: "include",
      });
      if (res.ok) {
        return { ok: true };
      }
      const text = await res.text();
      return { ok: false, error: text || "Failed to login" };
    } catch (e: any) {
      return { ok: false, error: e?.message || "Network error" };
    }
  },

  async getSession(): Promise<any | null> {
    try {
      const res = await fetch(`${api.baseUrl}/api/auth/session`, {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getHabits(): Promise<any[]> {
    const res = await fetch(`${api.baseUrl}/api/habits`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch habits");
    return await res.json();
  },

  async getHabitLogs(habitId: string): Promise<any[]> {
    const res = await fetch(`${api.baseUrl}/api/logs/${habitId}`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch logs");
    return await res.json();
  },

  async toggleHabit(habitId: string, dateIso: string, completed: boolean): Promise<boolean> {
    const res = await fetch(`${api.baseUrl}/api/logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ habitId, date: dateIso, completed }),
    });
    return res.ok;
  },
};