// Central place for every call the frontend makes to the backend.
// Change VITE_API_URL in frontend/.env if your backend runs somewhere else.

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const TOKEN_KEY = "datingapp_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new ApiError(data.error || `Request failed (${res.status})`, res.status);
    error.code = data.code;
    throw error;
  }
  return data;
}

// ---------- Auth ----------
export const requestOtp = (phone: string) =>
  request("/auth/request-otp", { method: "POST", body: JSON.stringify({ phone }) });

export const verifyOtp = (phone: string, code: string) =>
  request("/auth/verify-otp", { method: "POST", body: JSON.stringify({ phone, code }) });

export const requestEmailOtp = (email: string) =>
  request("/auth/request-email-otp", { method: "POST", body: JSON.stringify({ email }) });

export const verifyEmailOtp = (email: string, code: string, password?: string) =>
  request("/auth/verify-email-otp", {
    method: "POST",
    body: JSON.stringify({ email, code, password }),
  });

export const loginEmailPassword = (email: string, password: string) =>
  request("/auth/login-email", { method: "POST", body: JSON.stringify({ email, password }) });

// ---------- Profile ----------
export const getMyProfile = () => request("/profile/me");

export const updateMyProfile = (data: Record<string, unknown>) =>
  request("/profile/me", { method: "PUT", body: JSON.stringify(data) });

export const setInterests = (interestNames: string[]) =>
  request("/profile/interests", { method: "PUT", body: JSON.stringify({ interestNames }) });

export const uploadPhoto = async (file: File) => {
  const token = getToken();
  const form = new FormData();
  form.append("photo", file);
  const res = await fetch(`${API_URL}/profile/photos`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || "Upload failed", res.status);
  return data;
};

// ---------- Matching ----------
export const getDiscoverFeed = (country?: string) =>
  request(`/match/discover${country ? `?country=${encodeURIComponent(country)}` : ""}`);

export const likeUser = (toUserId: string, isSuperLike = false) =>
  request("/match/like", { method: "POST", body: JSON.stringify({ toUserId, isSuperLike }) });

export const getMyMatches = () => request("/match/matches");

export const getLikesReceived = () => request("/match/likes-received");

// ---------- Chat ----------
export const getMessages = (matchId: string) => request(`/chat/${matchId}/messages`);

export const sendMessageRest = (matchId: string, content: string) =>
  request(`/chat/${matchId}/messages`, { method: "POST", body: JSON.stringify({ content }) });

// ---------- Payments ----------
export const getPaymentPlans = (country?: string) =>
  request(`/payment/plans${country ? `?country=${encodeURIComponent(country)}` : ""}`);

export const startTrialSubscription = (plan: "MONTHLY" | "YEARLY", country?: string) =>
  request("/payment/start-trial", {
    method: "POST",
    body: JSON.stringify({ plan, country }),
  });

export const syncRevenueCatSubscription = () =>
  request("/payment/revenuecat-sync", { method: "POST" });

export { ApiError };
