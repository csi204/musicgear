export type TokenPayload = {
  access_token: string;
  refresh_token?: string;
  expires_in?: string;
  token_type?: string;
};

const AUTH_STORAGE_KEY = "mg_auth";
const SESSION_COOKIE = "mg_session";

export function getAuthBaseUrl() {
  return process.env.NEXT_PUBLIC_AUTH_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8788";
}

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? getAuthBaseUrl();
}

export function buildLoginUrl(returnPath = "/auth/callback") {
  if (typeof window === "undefined") {
    return `${getAuthBaseUrl()}/auth/login`;
  }

  const redirectUri = `${window.location.origin}${returnPath}`;
  return `${getAuthBaseUrl()}/auth/login?redirect_uri=${encodeURIComponent(redirectUri)}`;
}

export function buildRegisterUrl(returnPath = "/auth/callback") {
  if (typeof window === "undefined") {
    return `${getAuthBaseUrl()}/auth/register`;
  }

  const redirectUri = `${window.location.origin}${returnPath}`;
  return `${getAuthBaseUrl()}/auth/register?redirect_uri=${encodeURIComponent(redirectUri)}`;
}

export function buildLogoutUrl(returnPath = "/") {
  if (typeof window === "undefined") {
    return `${getAuthBaseUrl()}/auth/logout`;
  }

  const redirectUri = `${window.location.origin}${returnPath}`;
  return `${getAuthBaseUrl()}/auth/logout?redirect_uri=${encodeURIComponent(redirectUri)}`;
}

export function storeSession(tokens: TokenPayload) {
  sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokens));
  document.cookie = `${SESSION_COOKIE}=1; path=/; SameSite=Lax`;
}

export function getStoredSession(): TokenPayload | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as TokenPayload;
  } catch {
    return null;
  }
}

export function getAccessToken() {
  return getStoredSession()?.access_token ?? null;
}

export function clearSession() {
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem("mg_cached_user");
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function isAuthenticated() {
  return Boolean(getAccessToken());
}

export async function fetchCurrentUser() {
  const token = getAccessToken();
  if (!token) {
    return null;
  }

  const headers = { Authorization: `Bearer ${token}` };
  const apiBase = getApiBaseUrl();

  // Helper to normalize user object to always have id
  const normalizeUser = (user: any) => {
    if (!user) return null;
    return {
      ...user,
      id: user.userId || user.sub || null,
    };
  };

  // Check cache first
  if (typeof window !== "undefined") {
    const cachedUser = sessionStorage.getItem("mg_cached_user");
    if (cachedUser) {
      try {
        return JSON.parse(cachedUser);
      } catch {}
    }
  }

  // Try /users/me first — creates DB record if first login
  try {
    const res = await fetch(`${apiBase}/users/me`, { headers });
    if (res.ok) {
      const payload = await res.json();
      const user = normalizeUser(payload.user);
      if (typeof window !== "undefined" && user) {
        sessionStorage.setItem("mg_cached_user", JSON.stringify(user));
      }
      return user;
    }
  } catch {
    // network error, fall through to /auth/me
  }

  // Fallback: /auth/me returns basic JWT claims (no DB required)
  try {
    const res = await fetch(`${apiBase}/auth/me`, { headers });
    if (res.ok) {
      const payload = await res.json();
      const user = normalizeUser(payload.user);
      if (typeof window !== "undefined" && user) {
        sessionStorage.setItem("mg_cached_user", JSON.stringify(user));
      }
      return user;
    }
  } catch {
    // ignore
  }

  return null;
}
