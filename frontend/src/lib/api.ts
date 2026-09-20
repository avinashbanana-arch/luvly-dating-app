// Central place for every call the frontend makes to the backend.
// Change VITE_API_URL in frontend/.env if your backend runs somewhere else.

const configuredApiUrl = String(import.meta.env.VITE_API_URL || "").trim().replace(/\/$/, "");
const configuredSocketUrl = String(import.meta.env.VITE_SOCKET_URL || "").trim().replace(/\/$/, "");

// Do not fall back to localhost in a production APK. Localhost means the
// phone itself, not the deployed backend, and hides missing build config.
if (!configuredApiUrl) {
  throw new Error("VITE_API_URL is missing from the frontend build configuration.");
}

export const API_URL = configuredApiUrl;
export const SOCKET_URL = configuredSocketUrl || configuredApiUrl.replace(/\/api$/, "");
const REQUEST_TIMEOUT_MS = 25000;
const NETWORK_RETRIES = 1;

const TOKEN_KEY = "datingapp_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// Native WebView storage is normally persistent, but it can be cleared by
// Android while the app process is stopped. Preferences is backed by the
// operating system and is the source of truth for a native session.
export async function getStoredToken(): Promise<string | null> {
  const browserToken = getToken();
  if (browserToken) return browserToken;

  try {
    const { value } = await Preferences.get({ key: TOKEN_KEY });
    if (value) localStorage.setItem(TOKEN_KEY, value);
    return value;
  } catch (error) {
    console.error("[Luvly] Could not read the native session token", error);
    return null;
  }
}

export async function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  try {
    // Do not let the sign-in flow continue until Android confirms the value
    // has reached its native persistent store. A fire-and-forget write can be
    // lost if the user immediately force-closes the app after onboarding.
    await Preferences.set({ key: TOKEN_KEY, value: token });
  } catch (error) {
    console.error("[Luvly] Could not persist the native session token", error);
    // localStorage remains the fallback when running in a standard browser.
  }
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  void Preferences.remove({ key: TOKEN_KEY }).catch(() => {
    // no-op: browser fallback has already been cleared
  });
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

  let res: Response;
  try {
    res = await fetchWithRetry(`${API_URL}${path}`, { ...options, headers });
  } catch (err) {
    const error = new ApiError(
      "Couldn't reach the Luvly server. Please check your internet and try again.",
      0
    );
    error.code = err instanceof DOMException && err.name === "AbortError" ? "REQUEST_TIMEOUT" : "NETWORK_ERROR";
    throw error;
  }
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data.details ? `${data.error || "Request failed"}: ${data.details}` : data.error;
    const error = new ApiError(message || `Request failed (${res.status})`, res.status);
    error.code = data.code;
    throw error;
  }
  return data;
}

async function fetchWithRetry(url: string, options: RequestInit, retries = NETWORK_RETRIES) {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } catch (err) {
      lastError = err;
      if (attempt === retries) break;
      await new Promise((resolve) => window.setTimeout(resolve, 900));
    } finally {
      window.clearTimeout(timeout);
    }
  }
  throw lastError;
}

// ---------- Auth ----------
export const requestOtp = (phone: string, mode: "login" | "signup" | "continue" = "login") =>
  request("/auth/request-otp", { method: "POST", body: JSON.stringify({ phone, mode }) });

export const verifyOtp = (phone: string, code: string) =>
  request("/auth/verify-otp", { method: "POST", body: JSON.stringify({ phone, code, mode: "login" }) });

export const verifySignupOtp = (phone: string, code: string) =>
  request("/auth/verify-otp", { method: "POST", body: JSON.stringify({ phone, code, mode: "signup" }) });

export const verifyContinueOtp = (phone: string, code: string) =>
  request("/auth/verify-otp", { method: "POST", body: JSON.stringify({ phone, code, mode: "continue" }) });

export const requestEmailOtp = (email: string) =>
  request("/auth/request-email-otp", { method: "POST", body: JSON.stringify({ email }) });

export const verifyEmailOtp = (email: string, code: string, password?: string) =>
  request("/auth/verify-email-otp", {
    method: "POST",
    body: JSON.stringify({ email, code, password, mode: "login" }),
  });

export const verifySignupEmailOtp = (email: string, code: string, password?: string) =>
  request("/auth/verify-email-otp", {
    method: "POST",
    body: JSON.stringify({ email, code, password, mode: "signup" }),
  });

export const loginEmailPassword = (email: string, password: string) =>
  request("/auth/login-email", { method: "POST", body: JSON.stringify({ email, password }) });

// ---------- Profile ----------
export const getMyProfile = async () => {
  const result = await request("/profile/me");
  const overflow = result.user?.photos?.slice(5) || [];
  if (overflow.length) {
    // Remove legacy overflow photos left by earlier app versions without
    // blocking the profile screen. The server also enforces this limit.
    void Promise.allSettled(
      overflow.map((photo: { id: string }) =>
        request(`/profile/photos/${encodeURIComponent(photo.id)}`, { method: "DELETE" })
      )
    );
    result.user.photos = result.user.photos.slice(0, 5);
  }
  return result;
};

export const updateMyProfile = (data: Record<string, unknown>) =>
  request("/profile/me", { method: "PUT", body: JSON.stringify(data) });

export const setInterests = (interestNames: string[]) =>
  request("/profile/interests", { method: "PUT", body: JSON.stringify({ interestNames }) });

async function preparePhotoUpload(file: File): Promise<File> {
  // Phone gallery photos are often 5–20 MB. Resize them before sending so
  // completing a profile is reliable even on a cellular connection.
  if (!file.type.startsWith("image/") || file.size <= 1_500_000) return file;

  try {
    const imageUrl = URL.createObjectURL(file);
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Invalid image"));
      image.src = imageUrl;
    });
    URL.revokeObjectURL(imageUrl);

    const maxDimension = 1600;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const compressed = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82)
    );
    if (!compressed || compressed.size >= file.size) return file;
    return new File([compressed], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
  } catch {
    // Sending the original is safer than rejecting a valid photo because an
    // older WebView could not resize it.
    return file;
  }
}

export const uploadPhoto = async (file: File) => {
  const token = getToken();
  const form = new FormData();
  const uploadFile = await preparePhotoUpload(file);
  form.append("photo", uploadFile, uploadFile.name);
  const controller = new AbortController();
  // Uploading a photo can take longer than a normal API request, but must not
  // leave profile creation waiting forever if the upload service is unavailable.
  const timeout = window.setTimeout(() => controller.abort(), 60000);
  let res: Response;
  try {
    res = await fetch(`${API_URL}/profile/photos`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
      signal: controller.signal,
    });
  } catch (err) {
    const message = err instanceof DOMException && err.name === "AbortError"
      ? "Photo upload timed out. Please try again with a smaller photo or a stronger connection."
      : "Couldn't upload the photo. Please check your connection and try again.";
    throw new ApiError(message, 0);
  } finally {
    window.clearTimeout(timeout);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || "Upload failed", res.status);
  return data;
};

export const deletePhoto = (photoId: string) =>
  request(`/profile/photos/${encodeURIComponent(photoId)}`, { method: "DELETE" });

export const submitVerificationSelfie = async (file: File) => {
  const token = getToken();
  const form = new FormData();
  // Camera originals can exceed the API's multipart limit. Use the same
  // resize/compression path as profile photos before uploading the selfie.
  const uploadFile = await preparePhotoUpload(file);
  form.append("selfie", uploadFile, uploadFile.name);
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 60000);
  let res: Response;
  try {
    res = await fetch(`${API_URL}/profile/verify-selfie`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
      signal: controller.signal,
    });
  } catch (err) {
    const message = err instanceof DOMException && err.name === "AbortError"
      ? "Selfie upload timed out. Please try again with a smaller photo or a stronger connection."
      : "Couldn't upload the selfie. Please check your connection and try again.";
    throw new ApiError(message, 0);
  } finally {
    window.clearTimeout(timeout);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || "Selfie verification upload failed", res.status);
  return data;
};

// ---------- Matching ----------
export const getDiscoverFeed = (country?: string) =>
  request(`/match/discover${country ? `?country=${encodeURIComponent(country)}` : ""}`);

export const likeUser = (toUserId: string, isSuperLike = false) =>
  request("/match/like", { method: "POST", body: JSON.stringify({ toUserId, isSuperLike }) });

export const getDailyLikes = () => request("/match/daily-likes");

export const getMyMatches = () => request("/match/matches");

export const getLikesReceived = () => request("/match/likes-received");

export const getLikesSent = () => request("/match/likes-sent");

export const deleteMyAccount = () => request("/profile/me", { method: "DELETE" });

// ---------- Chat ----------
export const getMessages = (matchId: string) => request(`/chat/${matchId}/messages`);

export const sendMessageRest = (matchId: string, content: string) =>
  request(`/chat/${matchId}/messages`, { method: "POST", body: JSON.stringify({ content }) });

// ---------- Payments ----------
export const getPaymentPlans = (country?: string) =>
  request(`/payment/plans${country ? `?country=${encodeURIComponent(country)}` : ""}`);

export const createCommunityJoinOrder = (communityId: string) =>
  request("/payment/community/create-order", {
    method: "POST",
    body: JSON.stringify({ communityId }),
  });

export const verifyCommunityJoinPayment = (
  communityId: string,
  payment: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }
) =>
  request("/payment/community/verify", {
    method: "POST",
    body: JSON.stringify({ communityId, ...payment }),
  });

export const startTrialSubscription = (plan: "MONTHLY" | "YEARLY", country?: string) =>
  request("/payment/start-trial", {
    method: "POST",
    body: JSON.stringify({ plan, country }),
  });

export const syncRevenueCatSubscription = () =>
  request("/payment/revenuecat-sync", { method: "POST" });

export { ApiError };
import { Preferences } from "@capacitor/preferences";
