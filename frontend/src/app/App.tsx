import { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, User, ThumbsUp, Users } from "lucide-react";
import { SwipeCard, ActionButtons, Profile } from "./components/SwipeCard";
import { MatchModal } from "./components/MatchModal";
import { ChatList, Match } from "./components/ChatList";
import { ChatView } from "./components/ChatView";
import { ProfileView } from "./components/ProfileView";
import { LoginPage } from "./components/LoginPage";
import { ProfileSetup } from "./components/ProfileSetup";
import {
  API_URL,
  getToken,
  getStoredToken,
  clearToken,
  getMyProfile,
  updateMyProfile,
  uploadPhoto,
  submitVerificationSelfie,
  deletePhoto as deleteProfilePhoto,
  setInterests as apiSetInterests,
  getDiscoverFeed,
  getMyMatches,
  getLikesReceived,
  getLikesSent,
  getDailyLikes,
  likeUser,
  deleteMyAccount,
  startTrialSubscription,
  syncRevenueCatSubscription,
  ApiError,
} from "../lib/api";
import { disconnectSocket } from "../lib/socket";
import { purchaseMobileSubscription } from "../lib/mobileSubscriptions";
import { DiscoverFilters } from "./components/DiscoverFilters";
import { SettingsPage } from "./components/SettingsPage";
import { CommunityView } from "./components/CommunityView";
import { EditProfileModal } from "./components/EditProfileModal";
import { LikesView, LikedProfile } from "./components/LikesView";
import { PremiumModal } from "./components/PremiumModal";
import { ComplimentModal } from "./components/ComplimentModal";
import { ReportModal } from "./components/ReportModal";
import { detectCountryFromLocale, getCityOptionsForCountry, getCountryName, isValidCityForCountry } from "../lib/countries";
import {
  ChangeEmailModal,
  ChangePhoneModal,
  TermsModal,
  DeleteAccountModal,
} from "./components/SettingsModals";

// Mock data for profiles
// Mock user profile
const userProfile = {
  name: "You",
  age: 25,
  image:
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdHxlbnwwfHx8fDE3Njc4ODk3NzN8MA&ixlib=rb-4.1.0&q=80&w=1080",
  images: [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdHxlbnwwfHx8fDE3Njc4ODk3NzN8MA&ixlib=rb-4.1.0&q=80&w=1080",
  ],
  bio: "Living life to the fullest | Tech enthusiast | Love to travel and meet new people",
  location: "San Francisco, CA",
  country: detectCountryFromLocale() || "US",
  occupation: "UX Designer",
  education: "Stanford University",
  ethnicity: "Prefer not to say",
  religion: "",
  heightCm: "" as number | "",
  zodiacSign: "Leo",
  interests: ["Technology", "Travel", "Photography", "Fitness", "Music", "Food"],
  prompts: [
    { question: "My ideal Sunday", answer: "Exploring new cafes and hiking trails" },
    { question: "I geek out on", answer: "Latest tech gadgets and design trends" },
  ],
  communities: [],
};

type AppScreen = "login" | "restoring" | "setup" | "subscribe" | "main";
const SCREEN_KEY = "luvly_current_screen";
const TAB_KEY = "luvly_current_tab";
const CHAT_KEY = "luvly_selected_chat";
const SIGNUP_DRAFT_KEY = "luvly_signup_draft";
const SENT_LIKES_KEY = "luvly_sent_likes";
const SPLASH_MS = 3000;

function trace(event: string, details: Record<string, unknown> = {}) {
  // These records are visible in Chrome remote debugging / Android Logcat.
  // Never log the JWT itself; its presence and length are enough to diagnose
  // session persistence without exposing a credential.
  console.info(`[Luvly] ${event}`, details);
}

// Converts a backend user record (from /api/match/discover, /api/profile/me, etc.)
// into the `Profile` shape the existing UI components expect.
function mapUserToProfile(u: any): Profile {
  const ageFromDob = (dob: string | null) => {
    if (!dob) return 18;
    const diff = Date.now() - new Date(dob).getTime();
    return Math.max(18, Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000)));
  };
  // Older app versions stored the literal label "Current location" as a
  // city. Never show that placeholder as if it were a real location.
  const savedCity = String(u.city || "").trim();
  const hasNamedCity = savedCity && savedCity.toLowerCase() !== "current location";
  const location = hasNamedCity
    ? savedCity
    : u.country
      ? getCountryName(u.country)
      : "Location not set";

  const prompts = Array.isArray(u.prompts)
    ? u.prompts
    : typeof u.prompts === "string"
      ? (() => {
          try {
            const parsed = JSON.parse(u.prompts);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })()
      : [];

  // Photos created by older app releases may be stored as a relative
  // `/uploads/...` URL.  Resolve those against the API host before handing
  // them to an <img>; a Capacitor page otherwise treats them as paths on
  // `capacitor://localhost` and shows the broken-image icon.
  const mediaHost = API_URL.replace(/\/api\/?$/, "");
  const resolvePhotoUrl = (value: unknown) => {
    const url = String(value || "").trim();
    if (!url || url === "null" || url === "undefined") return "";
    if (/^https?:\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:")) return url;
    return `${mediaHost}${url.startsWith("/") ? "" : "/"}${url}`;
  };
  const photoUrls = Array.isArray(u.photos)
    ? u.photos.map((photo: any) => resolvePhotoUrl(photo?.url || photo)).filter(Boolean)
    : [];
  const fallbackImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`;

  return {
    id: u.id,
    name: u.name || "New user",
    email: u.email || "",
    phone: u.phone || "",
    age: ageFromDob(u.dob),
    bio: u.bio || "",
    location,
    occupation: u.occupation || u.jobTitle || "",
    jobTitle: u.jobTitle || "",
    education: u.education || "",
    religion: u.religion || "",
    heightCm: u.heightCm || "",
    preferredLanguage: u.preferredLanguage || "",
    ethnicity: u.ethnicity || u.ethnicGroup || "",
    gender: u.gender || "",
    preference: u.lookingFor || "",
    zodiacSign: u.zodiacSign || u.zodiac || u.astrology || "",
    video: u.videoUrl || u.video_url || u.video || "",
    prompts,
    communities: u.communities || [],
    isVerified: !!u.isVerified,
    image: photoUrls[0] || fallbackImage,
    country: u.country || "",
    images: photoUrls.length ? photoUrls : [fallbackImage],
    photoIds: Array.isArray(u.photos) ? u.photos.filter((photo: any) => String(photo?.url || "").trim()).map((photo: any) => photo.id) : [],
    interests: (u.interests || []).map((i: any) => i.interest?.name || i.name).filter(Boolean),
  };
}

function getSentLikesCacheKey(userId: string) {
  return `${SENT_LIKES_KEY}_${userId}`;
}

function readSentLikesCache(userId: string): LikedProfile[] {
  try {
    const raw = localStorage.getItem(getSentLikesCacheKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSentLikesCache(userId: string, likes: LikedProfile[]) {
  try {
    localStorage.setItem(getSentLikesCacheKey(userId), JSON.stringify(likes.slice(0, 500)));
  } catch {
    // ignore storage errors
  }
}

function mapProfileToLikedProfile(profile: Profile, timestamp: string, likedYouBack = false): LikedProfile {
  return {
    id: profile.id,
    name: profile.name,
    age: profile.age,
    image: profile.images[0] || profile.image,
    location: profile.location,
    likedYouBack,
    timestamp,
    bio: profile.bio,
    occupation: profile.occupation,
    education: profile.education,
    religion: profile.religion,
    heightCm: profile.heightCm,
    preferredLanguage: profile.preferredLanguage,
    ethnicity: profile.ethnicity,
    zodiacSign: profile.zodiacSign,
    jobTitle: profile.jobTitle,
    video: profile.video,
    preference: profile.preference,
    communities: profile.communities,
    isVerified: profile.isVerified,
    interests: profile.interests,
    images: profile.images,
    prompts: profile.prompts,
  };
}

function isProfileComplete(user: any) {
  // Ethnicity is required by the setup form and validated by the current
  // profile API. Do not use its immediate read-back as an onboarding gate:
  // older deployed APIs omit it from GET /profile/me even after accepting
  // the submitted value, which previously trapped valid users on step 11.
  return Boolean(
    user?.name &&
      user?.bio &&
      user?.city &&
      user?.country &&
      user?.gender &&
      user?.lookingFor &&
      Array.isArray(user?.photos) &&
      user.photos.length >= 3
  );
}

function getIncompleteProfileMessage(user: any) {
  const missing: string[] = [];
  if (!user?.name) missing.push("name");
  if (!user?.bio) missing.push("bio");
  if (!user?.city || !user?.country) missing.push("location");
  if (!user?.gender) missing.push("gender");
  if (!user?.lookingFor) missing.push("dating preference");

  const photoCount = Array.isArray(user?.photos) ? user.photos.length : 0;
  if (photoCount < 3) {
    return `Profile details were saved, but only ${photoCount} of 3 required photos uploaded. Go back to Step 8 and try the remaining photo${photoCount === 2 ? "" : "s"} again.`;
  }

  return missing.length
    ? `Profile details were saved, but ${missing.join(", ")} still needs to be completed. Please go back and update it.`
    : "Profile details were saved, but completion could not be confirmed. Please try again.";
}

export default function App() {
  // Keep returning users off the sign-in screen while their saved session is
  // being checked. Starting at "login" briefly showed the sign-in flow on
  // every app launch, and a temporary network error then discarded the token.
  // Preferences is asynchronous on native platforms, so wait to decide which
  // screen to show until its durable session store has been read.
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("restoring");
  // The authoritative "is signup finished" flag. Only ever set from a fresh
  // isProfileComplete(user) check against server data (never inferred from
  // currentScreen, cached navigation state, or lifecycle events) — see the
  // guard effect below, which is what actually prevents the Payment screen
  // from being reachable while this is false.
  const [signupComplete, setSignupComplete] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string>("");
  const [discoverProfiles, setDiscoverProfiles] = useState<Profile[]>([]);
  const [appLoading, setAppLoading] = useState(true);
  const [splashVisible, setSplashVisible] = useState(true);
  const [appError, setAppError] = useState("");
  const [currentTab, setCurrentTab] = useState<"profile" | "swipe" | "community" | "likes" | "messages">(
    () => (localStorage.getItem(TAB_KEY) as any) || "swipe"
  );
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [swipeAction, setSwipeAction] = useState<{ id: number; direction: "left" | "right" } | null>(null);
  const [swipeAnimating, setSwipeAnimating] = useState(false);
  const swipeInFlightRef = useRef(false);
  const navigateBackRef = useRef<() => boolean>(() => false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null);
  const [matchedChatId, setMatchedChatId] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchedProfiles, setMatchedProfiles] = useState<LikedProfile[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState("");
  const [selectedChatId, setSelectedChatId] = useState<string | null>(() => localStorage.getItem(CHAT_KEY));
  const [filters, setFilters] = useState({
    ageRange: [18, 80] as [number, number],
    distance: 25,
    region: "",
    country: detectCountryFromLocale(),
  });
  
  // Settings and profile states
  const [showSettings, setShowSettings] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [showChangePhone, setShowChangePhone] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  
  // User data states
  const [profile, setProfile] = useState(userProfile);
  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [phone, setPhone] = useState("+1 (555) 123-4567");
  
  // Likes system states
  const [likedByYou, setLikedByYou] = useState<LikedProfile[]>([]);
  const [likedYou, setLikedYou] = useState<LikedProfile[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [hasActiveAccess, setHasActiveAccess] = useState(false);
  const [dailyLikesCount, setDailyLikesCount] = useState(0);
  const [dailyLikesLimit, setDailyLikesLimit] = useState(50);
  const [nextFreeReveal, setNextFreeReveal] = useState<Date | null>(
    new Date(Date.now() + 3600000) // 1 hour from now
  );
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportedProfile, setReportedProfile] = useState<Profile | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setSplashVisible(false), SPLASH_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  // Enforcement point for requirement: Payment must never render unless
  // signup is verified complete. This runs on every currentScreen/
  // signupComplete change, so it catches every path that could otherwise
  // land on "subscribe" — lifecycle-driven remounts, race conditions
  // between async calls, or any future code that sets the screen directly —
  // not just the ones we've explicitly reasoned about above.
  useEffect(() => {
    if (currentScreen === "subscribe" && !signupComplete) {
      setCurrentScreen("setup");
    }
  }, [currentScreen, signupComplete]);

  useEffect(() => {
    // Frontend route guard: tabs are rendered only in the main shell, so a
    // stale navigation state cannot expose a premium section before the API
    // has confirmed trial/subscription access.
    if (currentScreen !== "main") return;
    if (!signupComplete) setCurrentScreen("setup");
    else if (!hasActiveAccess) setCurrentScreen("subscribe");
  }, [currentScreen, hasActiveAccess, signupComplete]);

  useEffect(() => {
    localStorage.setItem(SCREEN_KEY, currentScreen);
  }, [currentScreen]);

  useEffect(() => {
    trace("navigation:state", {
      route: currentScreen,
      hasToken: Boolean(authToken),
      tokenLength: authToken?.length || 0,
      userId: myUserId || null,
      onboardingCompleted: signupComplete,
      subscriptionStatus: hasActiveAccess ? "TRIAL_ACTIVE_OR_PAID" : "NOT_ACTIVE",
    });
  }, [authToken, currentScreen, hasActiveAccess, myUserId, signupComplete]);

  useEffect(() => {
    localStorage.setItem(TAB_KEY, currentTab);
  }, [currentTab]);

  useEffect(() => {
    if (selectedChatId) localStorage.setItem(CHAT_KEY, selectedChatId);
    else localStorage.removeItem(CHAT_KEY);
  }, [selectedChatId]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (currentScreen === "main" && currentTab === "swipe") {
      trace("discover:render", {
        userId: myUserId,
        hasToken: Boolean(authToken),
        profileCount: discoverProfiles.length,
        appLoading,
      });
    }
  }, [appLoading, authToken, currentScreen, currentTab, discoverProfiles.length, myUserId]);

  const navigateBack = () => {
    if (showMatchModal) return setShowMatchModal(false), true;
    if (showEditProfile) return setShowEditProfile(false), true;
    if (showChangeEmail) return setShowChangeEmail(false), setShowSettings(true), true;
    if (showChangePhone) return setShowChangePhone(false), setShowSettings(true), true;
    if (showTerms) return setShowTerms(false), setShowSettings(true), true;
    if (showDeleteAccount) return setShowDeleteAccount(false), setShowSettings(true), true;
    if (showPremiumModal) return setShowPremiumModal(false), true;
    if (showReportModal) return setShowReportModal(false), true;
    if (selectedChatId) return setSelectedChatId(null), true;
    if (showSettings) return setShowSettings(false), true;
    if (currentScreen === "main" && currentTab !== "swipe") return setCurrentTab("swipe"), true;
    if (currentScreen === "subscribe") return setCurrentScreen("setup"), true;
    return false;
  };

  // Keep the popstate listener stable. Replacing history entries on every
  // state update erases the in-app back destination and lets Android exit.
  navigateBackRef.current = navigateBack;

  useEffect(() => {
    window.history.replaceState({ luvlyRoot: true }, "");
    window.history.pushState({ luvlyGuard: true }, "");
    const handlePopState = () => {
      const handled = navigateBackRef.current();
      if (handled) window.history.pushState({ luvlyGuard: true }, "");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // ---------- Real backend data loading ----------

  // Returning users must never be sent back into the blank sign-up wizard.
  // The wizard is entered only straight after creating a brand-new account.
  const loadMainData = async (allowIncompleteProfile = true) => {
    trace("load-main:start", { allowIncompleteProfile, hasToken: Boolean(getToken()), tokenLength: getToken()?.length || 0 });
    setAppLoading(true);
    setAppError("");
    setMatchesLoading(true);
    try {
      const meRes = await getMyProfile();
      trace("load-main:profile-response", { userId: meRes.user?.id, hasUser: Boolean(meRes.user), hasAccess: Boolean(meRes.access?.hasActiveAccess) });
      setMyUserId(meRes.user.id);
      setIsPremium(!!meRes.user.isPremium);
      setHasActiveAccess(!!meRes.access?.hasActiveAccess);
      setEmail(meRes.user.email || "");
      setPhone(meRes.user.phone || "");
      setProfile((prev) => ({ ...prev, ...mapUserToProfile(meRes.user) } as any));

      const complete = isProfileComplete(meRes.user);
      setSignupComplete(complete);

      if (!allowIncompleteProfile && !complete) {
        trace("load-main:navigate-setup", { complete });
        setCurrentScreen("setup");
        return;
      }

      if (!meRes.access?.hasActiveAccess) {
        trace("load-main:navigate-subscribe", { complete });
        setCurrentScreen("subscribe");
        return;
      }

      const cachedSentLikes = readSentLikesCache(meRes.user.id);
      const [discoverRes, matchesRes, likesRes, likesSentRes, dailyLikesRes] = await Promise.all([
        getDiscoverFeed(filters.country),
        getMyMatches()
          .then((result) => {
            setMatchesError("");
            return result;
          })
          .catch(() => {
            setMatchesError("Couldn't refresh matches. Please try again.");
            return { matches: [] };
          }),
        getLikesReceived().catch(() => ({ likes: [] })),
        getLikesSent().catch((err) => {
          console.warn("Failed to load sent likes from backend", err);
          return { likes: [] };
        }),
        // Daily Likes is supplementary data. A rolling mobile release can be
        // installed before its matching backend route has deployed, so this
        // request must never turn a valid session into a failed sign-in.
        getDailyLikes().catch((err) => {
          console.warn("Failed to load daily likes from backend", err);
          return { dailyLikes: null };
        }),
      ]);

      if (dailyLikesRes.dailyLikes) {
        setDailyLikesCount(dailyLikesRes.dailyLikes.count || 0);
        setDailyLikesLimit(dailyLikesRes.dailyLikes.limit || 50);
      }

      setDiscoverProfiles((discoverRes.candidates || []).map(mapUserToProfile));
      trace("load-main:discover-response", { candidateCount: discoverRes.candidates?.length || 0 });
      setCurrentProfileIndex(0);
      setMatches(
        (matchesRes.matches || []).map((m: any) => ({
          id: m.matchId,
          userId: m.otherUser?.id,
          name: m.otherUser?.name || "Match",
          image:
            m.otherUser?.photos?.[0]?.url ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.otherUser?.id}`,
          lastMessage: "Tap to start chatting",
          timestamp: new Date(m.createdAt).toLocaleDateString(),
          unread: false,
          profile: mapUserToProfile(m.otherUser),
        }))
      );
      setMatchedProfiles(
        (matchesRes.matches || []).map((m: any) =>
          mapProfileToLikedProfile(
            mapUserToProfile(m.otherUser),
            new Date(m.createdAt).toLocaleDateString(),
            true
          )
        )
      );
      const matchedUserIds = new Set((matchesRes.matches || []).map((m: any) => m.otherUser?.id));
      setLikedYou(
        (likesRes.likes || []).filter((like: any) => !matchedUserIds.has(like.fromUser?.id)).map((like: any) => {
          const p = mapUserToProfile(like.fromUser);
          return {
            id: p.id,
            name: p.name,
            age: p.age,
            image: p.images[0],
            location: p.location,
            likedYouBack: false,
            timestamp: new Date(like.createdAt).toLocaleString(),
            bio: p.bio,
            occupation: p.occupation,
            education: p.education,
            interests: p.interests,
            images: p.images,
            prompts: p.prompts, religion: p.religion, preferredLanguage: p.preferredLanguage,
            ethnicity: p.ethnicity, zodiacSign: p.zodiacSign, jobTitle: p.jobTitle, video: p.video,
            preference: p.preference, communities: p.communities, isVerified: p.isVerified,
          };
        })
      );
      const backendSentLikes = (likesSentRes.likes || []).filter((like: any) => !matchedUserIds.has(like.toUser?.id)).map((like: any) => {
        const p = mapUserToProfile(like.toUser);
        return {
          id: p.id,
          name: p.name,
          age: p.age,
          image: p.images[0],
          location: p.location,
          likedYouBack: false,
          timestamp: new Date(like.createdAt).toLocaleString(),
          bio: p.bio,
          occupation: p.occupation,
          education: p.education,
          interests: p.interests,
          images: p.images,
          prompts: p.prompts, religion: p.religion, preferredLanguage: p.preferredLanguage,
          ethnicity: p.ethnicity, zodiacSign: p.zodiacSign, jobTitle: p.jobTitle, video: p.video,
          preference: p.preference, communities: p.communities, isVerified: p.isVerified,
        };
      });
      const mergedSentLikes = [...backendSentLikes];
      cachedSentLikes.filter((cached) => !matchedUserIds.has(cached.id)).forEach((cached) => {
        if (!mergedSentLikes.some((item) => item.id === cached.id)) {
          mergedSentLikes.push(cached);
        }
      });
      setLikedByYou(mergedSentLikes);
      writeSentLikesCache(meRes.user.id, mergedSentLikes);
      const savedChatId = localStorage.getItem(CHAT_KEY);
      if (savedChatId && (matchesRes.matches || []).some((m: any) => m.matchId === savedChatId)) {
        setSelectedChatId(savedChatId);
      }
      setCurrentScreen("main");
      // Keep the requested destination. In particular, payment completion
      // opens the saved Profile tab rather than being overwritten by this
      // background refresh.
      setCurrentTab((tab) => tab);
      trace("load-main:navigate-main", { userId: meRes.user.id });
    } catch (err) {
      console.error("[Luvly] load-main failed", err);
      if (err instanceof ApiError && err.code === "PREMIUM_REQUIRED") {
        setCurrentScreen("subscribe");
        setAppError("");
        return;
      }
      setAppError(err instanceof ApiError ? err.message : "Couldn't reach the backend. Is it running?");
    } finally {
      setAppLoading(false);
      setMatchesLoading(false);
    }
  };

  const openEditProfile = async () => {
    try {
      const meRes = await getMyProfile();
      setProfile((previous) => ({ ...previous, ...mapUserToProfile(meRes.user) } as any));
      setEmail(meRes.user.email || "");
      setPhone(meRes.user.phone || "");
    } catch {
      // The existing in-memory profile remains editable if a refresh fails.
      setToast("Couldn't refresh your profile. Showing the last saved details.");
    } finally {
      setShowEditProfile(true);
    }
  };

  const openChangeEmail = async () => {
    setShowSettings(false);
    setShowChangeEmail(true);
    setEmailLoading(true);
    try {
      const meRes = await getMyProfile();
      setEmail(meRes.user.email || "");
    } catch {
      setToast("Couldn't load your current email. Please try again.");
    } finally {
      setEmailLoading(false);
    }
  };

  // On first load, if we already have a saved token, try to resume the session.
  useEffect(() => {
    const restoreSession = async () => {
      const existing = await getStoredToken();
      if (!existing) {
        setCurrentScreen("login");
        setAppLoading(false);
        return;
      }

      setAuthToken(existing);
      try {
        const meRes = await getMyProfile();
        setMyUserId(meRes.user.id);
      setIsPremium(!!meRes.user.isPremium);
        setHasActiveAccess(!!meRes.access?.hasActiveAccess);
        const complete = isProfileComplete(meRes.user);
        setSignupComplete(complete);
        // Signup completeness must be checked before access/subscription
        // status. An unfinished signup has no meaningful access state yet,
        // and checking access first was sending users with an incomplete
        // profile straight to the Payment screen on every app resume/relaunch
        // (e.g. after the OS reclaims the Activity in the background) instead
        // of back to the signup wizard.
        if (!complete) {
          setCurrentScreen("setup");
          setAppLoading(false);
          return;
        }
        if (!meRes.access?.hasActiveAccess) {
          setCurrentScreen("subscribe");
          setAppLoading(false);
          return;
        }
        await loadMainData(true);
      } catch (err) {
        // A rejected or expired token cannot recover on retry. Clear it and
        // return to sign-in instead of leaving the app on the restore screen.
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          clearToken();
          setAuthToken(null);
          setCurrentScreen("login");
          setAppLoading(false);
          return;
        }

        // Keep the durable session for actual service/network failures so a
        // temporary outage does not force the user through sign-up again.
        setAppError(
          err instanceof ApiError
            ? err.message
            : "Couldn't restore your session. Check your connection and try again."
        );
        setAppLoading(false);
      }
    };

    void restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAuthenticated = (isNewUser: boolean) => {
    const token = getToken();
    trace("auth:otp-complete", { isNewUser, hasToken: Boolean(token), tokenLength: token?.length || 0 });
    setAuthToken(token);
    if (isNewUser) {
      setCurrentScreen("setup");
    } else {
      // Never render premium tabs from a cached navigation state. Fetch the
      // authoritative current user and access state first.
      setCurrentScreen("restoring");
      void loadMainData();
    }
  };

  const handleProfileSetupComplete = async (data: any) => {
    let created = false;
    let submissionFailed = false;
    const requiredPhotoFiles = data.photoFiles || [];

    // Finishing setup must take the user to the required access screen
    // immediately. Uploads are persisted afterward and cannot block checkout.
    const localImages = requiredPhotoFiles.map((file: File) => URL.createObjectURL(file));
    const localVideo = data.videoFile ? URL.createObjectURL(data.videoFile) : "";
    setProfile((current) => ({
      ...current,
      name: data.name,
      age: data.age,
      bio: data.bio,
      location: data.location,
      country: data.country,
      gender: data.gender,
      preference: data.preference,
      occupation: data.occupation || "",
      education: data.education || "",
      ethnicity: data.ethnicity || "",
      zodiacSign: data.zodiacSign || "",
      religion: data.religion || "",
      heightCm: data.heightCm || undefined,
      interests: data.interests || [],
      prompts: data.prompts || [],
      video: localVideo || current.video,
      image: localImages[0] || current.image,
      images: localImages.length ? localImages : current.images,
    } as any));
    setAppLoading(true);

    try {
      if (!navigator.onLine) {
        setToast("Profile saved on this device. Connect to the internet to finish uploading photos.");
        return null;
      }
      const genderMap: Record<string, string> = {
        male: "MALE",
        female: "FEMALE",
        "non-binary": "NON_BINARY",
        transgender: "OTHER",
        other: "OTHER",
      };
      // The setup screen collects an age, not a date of birth; this backend
      // stores `dob`, so we approximate it from the chosen age.
      const approxBirthYear = new Date().getFullYear() - (data.age || 25);

      // Save the text profile first. This makes the account recoverable even
      // if a mobile upload is interrupted, and avoids competing with uploads.
      // This must run before the photo-count checks below: those checks
      // return early, and the wizard's only photo-like input is a single
      // verification selfie (no gallery upload step), so requiredPhotoFiles
      // is always empty. Running the save after those checks meant this
      // call — and therefore every collected field (religion, height,
      // zodiac sign, bio, location, etc.) — never executed for any new
      // signup.
      await updateMyProfile({
        name: data.name,
        email: data.email,
        gender: genderMap[data.gender] || undefined,
        lookingFor: data.preference,
        bio: data.bio || undefined,
        occupation: data.occupation,
        education: data.education,
        ethnicity: data.ethnicity,
        // Some deployed API versions still expose this field under its
        // original name. Sending both lets signup work during a rolling
        // backend upgrade, while the current backend persists `ethnicity`.
        ethnicGroup: data.ethnicity,
        zodiacSign: data.zodiacSign,
        religion: data.religion,
        heightCm: data.heightCm,
        city: data.location,
        country: data.country,
        latitude: data.latitude,
        longitude: data.longitude,
        prompts: data.prompts || [],
        dob: new Date(approxBirthYear, 0, 1).toISOString(),
      });
      // Mark the text profile persisted before any optional media handling.
      // A signup without three gallery photos returns below, but it still
      // needs the finally block to re-fetch the server record so occupation,
      // ethnicity, zodiac sign, prompts and an uploaded video all populate
      // the Edit Profile form from the canonical API response.
      created = true;
      if (data.interests?.length) await apiSetInterests(data.interests);

      // Fetch once and reuse for both the video-upload check and the photo
      // upload loop below.
      const savedProfile = await getMyProfile();

      // Video upload is independent of the gallery-photo requirement below —
      // a signup that hasn't finished its 3 required photos yet shouldn't
      // also lose a video the user actually provided.
      if (data.videoFile && !savedProfile.user?.videoUrl) await uploadPhoto(data.videoFile);

      if (requiredPhotoFiles.length < 3) {
        setToast("Profile saved. Add at least 3 photos when you edit your profile.");
        return null;
      }
      if (requiredPhotoFiles.length > 5) {
        setToast("Profile saved. You can upload a maximum of 5 photos.");
        return null;
      }

      // Upload in order rather than opening several large uploads at once.
      // On retry, skip files that have already reached the server.
      const uploadedPhotoCount = savedProfile.user?.photos?.length || 0;
      for (const file of requiredPhotoFiles.slice(uploadedPhotoCount, 5)) {
        await uploadPhoto(file);
      }
      if (data.selfieFile) await submitVerificationSelfie(data.selfieFile);
      setToast("Profile created successfully.");
    } catch (err) {
      submissionFailed = true;
      const message =
        !navigator.onLine
          ? "Upload failed. No internet connection."
          : err instanceof ApiError
            ? err.message
            : "Could not create profile.";
      console.error(err);
      setAppLoading(false);
      setToast(`${message} Your profile is available in the app; try saving again from Edit Profile.`);
      return null;
    } finally {
      if (!created) {
        setAppLoading(false);
      } else {
        const meRes = await getMyProfile().catch(() => null);
        if (meRes?.user) {
          // Always use the server response as the source of truth. Previously
          // this only ran for a fully completed profile, which meant valid
          // video, prompts, ethnicity and zodiac data could remain absent from
          // both Profile and Edit Profile state.
          setMyUserId(meRes.user.id);
          setEmail(meRes.user.email || "");
          setPhone(meRes.user.phone || "");
          setProfile((prev) => ({ ...prev, ...mapUserToProfile(meRes.user) } as any));
        }
        if (!meRes?.user || !isProfileComplete(meRes.user)) {
          // Do not replace a concrete API/upload error with this final
          // completeness check. That used to make failed photo uploads look
          // like an unexplained profile-save problem.
          if (!submissionFailed) {
            setToast(getIncompleteProfileMessage(meRes?.user));
          }
          setAppLoading(false);
        } else {
          setSignupComplete(true);
          setCurrentScreen("subscribe");
          localStorage.removeItem(SIGNUP_DRAFT_KEY);
          setAppLoading(false);
        }
      }
    }
    return null;
  };

  const handleRequiredSubscription = async (plan: "MONTHLY" | "YEARLY") => {
    trace("payment:submit", { plan, userId: myUserId, hasToken: Boolean(getToken()) });
    try {
      const purchaseResult = await purchaseMobileSubscription(myUserId, plan);
      trace("payment:purchase-response", { usedStore: purchaseResult.usedStore });
      if (purchaseResult.usedStore) {
        await syncRevenueCatSubscription();
      } else {
        await startTrialSubscription(plan, filters.country || profile.country);
      }

      // Confirm the account state from the API before navigation. This makes
      // auth, subscription access, and the profile state atomic from the
      // React app's point of view after an Android checkout returns.
      const profileResponse = await getMyProfile();
      if (!profileResponse.user || !profileResponse.access?.hasActiveAccess) {
        throw new Error("Your subscription was not activated. Please try again.");
      }
      const token = getToken();
      setAuthToken(token);
      setMyUserId(profileResponse.user.id);
      setProfile((previous) => ({ ...previous, ...mapUserToProfile(profileResponse.user) } as any));
      setSignupComplete(isProfileComplete(profileResponse.user));
      setIsPremium(true);
      setHasActiveAccess(true);
      // The first screen after payment is the completed profile, populated
      // from the backend response rather than the temporary signup form.
      setCurrentTab("profile");
      setCurrentScreen("main");
      setToast("Your 3-day Premium trial has started.");
      trace("payment:navigate-main", {
        userId: profileResponse.user.id,
        hasToken: Boolean(token),
        subscriptionStatus: profileResponse.user.subscriptionStatus,
        paymentSuccess: true,
        destination: "profile",
      });

      // The main shell is now valid. Refresh Discover in the background; its
      // own catch path renders a visible error rather than a blank WebView.
      void loadMainData(true);
    } catch (error) {
      console.error("[Luvly] payment completion failed", error);
      throw error;
    }
  };

  const handleLogout = () => {
    clearToken();
    disconnectSocket();
    setAuthToken(null);
    setMyUserId("");
    setSignupComplete(false);
    setDiscoverProfiles([]);
    setMatches([]);
    setMatchedProfiles([]);
    if (myUserId) localStorage.removeItem(getSentLikesCacheKey(myUserId));
    localStorage.removeItem(SCREEN_KEY);
    localStorage.removeItem(TAB_KEY);
    localStorage.removeItem(CHAT_KEY);
    localStorage.removeItem(SIGNUP_DRAFT_KEY);
    setCurrentScreen("login");
  };

  const addSentLike = (likedProfile: LikedProfile) => {
    setLikedByYou((prev) => {
      const next = [likedProfile, ...prev.filter((p) => p.id !== likedProfile.id)];
      if (myUserId) writeSentLikesCache(myUserId, next);
      return next;
    });
  };

  const syncDailyLikes = async () => {
    try {
      const result = await getDailyLikes();
      // Older server deployments do not include this new field. Do not
      // replace a confirmed count with zero while the backend is catching up.
      if (result.dailyLikes) {
        setDailyLikesCount(result.dailyLikes.count || 0);
        setDailyLikesLimit(result.dailyLikes.limit || 50);
      }
    } catch {
      // Keep the last confirmed count visible if the refresh is offline.
    }
  };

  const persistLike = async (currentProfile: Profile) => {
    try {
      const result = await likeUser(currentProfile.id);

      const likedProfile: LikedProfile = {
        id: currentProfile.id,
        name: currentProfile.name,
        age: currentProfile.age,
        image: currentProfile.images[0],
        location: currentProfile.location,
        likedYouBack: !!result.match,
        timestamp: "Just now",
        bio: currentProfile.bio,
        occupation: currentProfile.occupation,
        education: currentProfile.education,
        interests: currentProfile.interests,
        images: currentProfile.images,
        prompts: currentProfile.prompts,
        religion: currentProfile.religion,
        preferredLanguage: currentProfile.preferredLanguage,
        ethnicity: currentProfile.ethnicity,
        zodiacSign: currentProfile.zodiacSign,
        jobTitle: currentProfile.jobTitle,
        video: currentProfile.video,
        preference: currentProfile.preference,
        communities: currentProfile.communities,
        isVerified: currentProfile.isVerified,
      };
      addSentLike(likedProfile);
      // The live response is authoritative when the deployed API supports
      // Daily Likes. Legacy deployments omit it, so retain the last known
      // value rather than incorrectly displaying 0/50.
      if (result.dailyLikes) {
        setDailyLikesCount(result.dailyLikes.count || 0);
        setDailyLikesLimit(result.dailyLikes.limit || 50);
      }

      if (result.match) {
        // Mutual likes belong exclusively in Matches, never Sent/Received.
        setLikedByYou((prev) => prev.filter((profile) => profile.id !== currentProfile.id));
        setLikedYou((prev) => prev.filter((profile) => profile.id !== currentProfile.id));
        setMatchedProfile(currentProfile);
        setMatchedChatId(result.match.id);
        setShowMatchModal(true);
        setMatchedProfiles((prev) => [
          mapProfileToLikedProfile(currentProfile, "Just now", true),
          ...prev.filter((profile) => profile.id !== currentProfile.id),
        ]);
        setMatches((prev) => [
          {
            id: result.match.id,
            userId: currentProfile.id,
            name: currentProfile.name,
            image: currentProfile.images[0],
            lastMessage: "Tap to start chatting",
            timestamp: "Just now",
            unread: true,
            profile: currentProfile,
          },
          ...prev,
        ]);
      }
      return true;
    } catch (err) {
      setToast(err instanceof ApiError ? err.message : "Couldn't like this profile. Please try again.");
      return false;
    }
  };

  const handleSwipe = async (direction: "left" | "right") => {
    const currentProfile = filteredProfiles[currentProfileIndex];
    if (!currentProfile) {
      setSwipeAnimating(false);
      setSwipeAction(null);
      swipeInFlightRef.current = false;
      return false;
    }

    // Never make the visible deck wait on a network round trip. The card has
    // already completed its exit animation by this point, so holding this
    // state here leaves the interface looking frozen on slow connections.
    setCurrentProfileIndex((prev) => prev + 1);
    setSwipeAnimating(false);
    setSwipeAction(null);
    swipeInFlightRef.current = false;
    if (direction === "right") void persistLike(currentProfile);
    return true;
  };

  const triggerSwipeAnimation = (direction: "left" | "right") => {
    if (swipeInFlightRef.current || swipeAnimating || currentProfileIndex >= filteredProfiles.length) return;
    swipeInFlightRef.current = true;
    setSwipeAnimating(true);
    setSwipeAction({ id: Date.now(), direction });
  };

  const handlePass = () => triggerSwipeAnimation("left");
  const handleLike = () => triggerSwipeAnimation("right");

  const handleApplyFilters = async (nextFilters: typeof filters) => {
    if (nextFilters.ageRange[0] >= nextFilters.ageRange[1]) {
      alert("Minimum age must be less than maximum age.");
      return;
    }
    if (
      nextFilters.country &&
      nextFilters.region &&
      getCityOptionsForCountry(nextFilters.country).length > 0 &&
      !isValidCityForCountry(nextFilters.country, nextFilters.region)
    ) {
      alert("Select a city that belongs to the chosen country.");
      return;
    }
    setFilters(nextFilters);
    setCurrentProfileIndex(0);
    try {
      const discoverRes = await getDiscoverFeed(nextFilters.country);
      setDiscoverProfiles((discoverRes.candidates || []).map(mapUserToProfile));
    } catch (err) {
      if (err instanceof ApiError && err.code === "PREMIUM_REQUIRED") {
        setShowPremiumModal(true);
      }
    }
  };

  const handleCommunityJoined = (communities: string[]) => {
    const activeCommunity = communities.slice(-1);
    setProfile((current) => ({ ...current, communities: activeCommunity } as any));
    void updateMyProfile({ communities: activeCommunity }).catch(() => {
      setToast("Community joined. It will sync when your connection is available.");
    });
  };

  const handleSendMessage = () => {
    setShowMatchModal(false);
    setCurrentTab("messages");
    // A mutual like creates the Match record on the server. Its id is the
    // stable conversation id, so do not depend on a pending React state update
    // or fall back to an unrelated first conversation.
    if (matchedChatId) setSelectedChatId(matchedChatId);
    else if (matchedProfile) void openMatchedChat(mapProfileToLikedProfile(matchedProfile, "Just now", true));
  };

  const openMatchedChat = async (matchedUser: LikedProfile) => {
    let match = matches.find((item) => item.userId === matchedUser.id);

    // A Match record is the conversation. A new match therefore has a valid,
    // empty chat immediately; no separate conversation-creation request is
    // needed before opening the message screen.
    if (!match) {
      try {
        const result = await getMyMatches();
        const refreshed: Match[] = (result.matches || []).map((item: any) => ({
          id: item.matchId,
          userId: item.otherUser?.id,
          name: item.otherUser?.name || "Match",
          image:
            item.otherUser?.photos?.[0]?.url ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.otherUser?.id}`,
          lastMessage: "Tap to start chatting",
          timestamp: new Date(item.createdAt).toLocaleDateString(),
          unread: false,
          profile: mapUserToProfile(item.otherUser),
        }));
        setMatches(refreshed);
        match = refreshed.find((item) => item.userId === matchedUser.id);
      } catch {
        setToast("Couldn't open this chat. Please try again.");
        return false;
      }
    }

    if (!match) {
      setToast("This match is still being created. Please try again in a moment.");
      return false;
    }

    setSelectedChatId(match.id);
    setCurrentTab("messages");
    return true;
  };

  const selectedMatch = matches.find((m) => m.id === selectedChatId);

  // Filter profiles based on filters
  const filteredProfiles = discoverProfiles.filter((profile) => {
    const ageMatch =
      profile.age >= filters.ageRange[0] && profile.age <= filters.ageRange[1];
    const regionMatch =
      !filters.region ||
      profile.location.toLowerCase().includes(filters.region.toLowerCase());
    const countryMatch = !filters.country || profile.country === filters.country;
    return ageMatch && regionMatch && countryMatch;
  });
  const visibleProfiles = filteredProfiles.slice(currentProfileIndex, currentProfileIndex + 2);

  if (splashVisible) {
    return (
      <div className="relative flex h-screen items-center justify-center overflow-hidden bg-[#070711] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_14%,rgba(255,46,118,0.58),transparent_32%),radial-gradient(circle_at_18%_0%,rgba(105,10,48,0.72),transparent_34%),linear-gradient(160deg,#05050e_0%,#220615_42%,#090912_100%)]" />
        <div className="absolute right-[-100px] top-20 h-80 w-80 rounded-full border border-[#ff7aa6]/30 bg-[#ff1f68]/10 blur-[2px]" />
        <div className="relative text-center">
          <div className="mx-auto mb-5 flex h-24 w-24 animate-pulse items-center justify-center rounded-[30px] border border-[#ffd59b]/50 bg-gradient-to-br from-[#ff7fb0] via-[#f21866] to-[#8e062f] shadow-[0_18px_55px_rgba(255,28,96,0.45)]">
            <Heart className="h-14 w-14 fill-[#ff2f74] text-[#ffd79b]" strokeWidth={1.8} />
          </div>
          <p className="font-serif text-5xl text-[#ffe1ae] drop-shadow-[0_6px_18px_rgba(0,0,0,0.35)]">
            Luvly
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.34em] text-white/70">
            Welcome
          </p>
        </div>
      </div>
    );
  }

  if (currentScreen === "restoring") {
    return (
      <div className="flex h-screen items-center justify-center bg-[#070711] px-6 text-center text-white">
        <div>
          <Heart className="mx-auto mb-5 h-12 w-12 animate-pulse fill-[#ff2f74] text-[#ffd79b]" />
          <p className="text-lg font-semibold">Restoring your session…</p>
          {appError && (
            <>
              <p className="mt-3 max-w-sm text-sm text-white/65">{appError}</p>
              <button
                type="button"
                onClick={() => {
                  setAppError("");
                  setAppLoading(true);
                  loadMainData();
                }}
                className="mt-5 rounded-xl bg-[#e3135b] px-5 py-3 text-sm font-semibold"
              >
                Try again
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Auth and setup flow
  if (currentScreen === "login") {
    return (
      <div className="h-screen bg-[#070711]">
        {toast && (
          <div className="fixed top-4 left-1/2 z-[60] -translate-x-1/2 rounded-full border border-[#d89075]/50 bg-[#090912] px-4 py-2 text-sm text-[#ffd9aa] shadow-lg">
            {toast}
          </div>
        )}
        <LoginPage onLogin={handleAuthenticated} />
      </div>
    );
  }

  if (currentScreen === "setup") {
    return (
      <div className="h-screen bg-[#070711]">
        {toast && (
          <div className="fixed top-4 left-1/2 z-[60] -translate-x-1/2 rounded-full border border-[#d89075]/50 bg-[#090912] px-4 py-2 text-sm text-[#ffd9aa] shadow-lg max-w-[90%] text-center">
            {toast}
          </div>
        )}
        <ProfileSetup onComplete={handleProfileSetupComplete} />
      </div>
    );
  }

  if (currentScreen === "subscribe") {
    return (
      <div className="h-screen bg-[#070711] flex items-center justify-center p-4">
        {toast && (
          <div className="fixed top-4 left-1/2 z-[60] -translate-x-1/2 rounded-full border border-[#d89075]/50 bg-[#090912] px-4 py-2 text-sm text-[#ffd9aa] shadow-lg max-w-[90%] text-center">
            {toast}
          </div>
        )}
        <PremiumModal
          isOpen
          required
          country={filters.country || profile.country}
          onClose={() => {}}
          onUpgrade={handleRequiredSubscription}
        />
      </div>
    );
  }

  if (appError) {
    return (
      <div className="h-screen bg-[#070711] flex items-center justify-center p-6">
        <div className="text-center max-w-sm rounded-[28px] border border-[#d89075]/50 bg-[#080912]/90 p-6 shadow-2xl">
          <p className="text-[#ff9caf] mb-4">{appError}</p>
          <button
            onClick={loadMainData}
            className="px-6 py-3 bg-gradient-to-r from-[#f01c66] to-[#c9064f] text-white rounded-2xl"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Main app
  return (
    <div className="relative h-screen overflow-hidden bg-[#070711] flex items-center justify-center p-4 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_12%,rgba(255,46,118,0.35),transparent_32%),radial-gradient(circle_at_18%_0%,rgba(105,10,48,0.58),transparent_34%),linear-gradient(160deg,#05050e_0%,#220615_42%,#090912_100%)]" />
      <div className="absolute right-[-120px] top-16 h-96 w-96 rounded-full border border-[#ff7aa6]/20 bg-[#ff1f68]/10 blur-[2px]" />
      {toast && (
        <div className="fixed top-4 left-1/2 z-[60] -translate-x-1/2 rounded-full border border-[#d89075]/50 bg-[#090912] px-4 py-2 text-sm text-[#ffd9aa] shadow-lg">
          {toast}
        </div>
      )}
      <div className="relative z-10 w-full max-w-md h-full max-h-[800px] overflow-hidden flex flex-col rounded-[30px] border border-[#d89075]/45 bg-[#080912]/95 shadow-[0_28px_80px_rgba(0,0,0,0.58)] backdrop-blur">
        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {currentTab === "swipe" && (
            <div className="flex h-full min-h-0 flex-col">
              {/* Header */}
              <div className="shrink-0 p-6 flex items-center justify-between border-b border-white/10 bg-[#080912]">
                <div className="flex items-center">
                  <Heart className="w-8 h-8 text-[#ffd79b] fill-[#ff2f74]" />
                  <h1 className="font-serif text-3xl ml-2 text-[#ffe1ae]">
                    Luvly
                  </h1>
                </div>
                <DiscoverFilters filters={filters} onApply={handleApplyFilters} />
              </div>

              {/* Swipe Cards */}
              <div className="relative min-h-0 flex-1 bg-[#080912] px-6 pt-6">
                {currentProfileIndex >= filteredProfiles.length ? (
                  <div className="h-full flex flex-col items-center justify-center text-white/55">
                    <Heart className="w-16 h-16 mb-4 text-[#ff3f7f]" />
                    <p className="text-lg text-[#ffe1ae]">No more profiles</p>
                    <p className="text-sm">Check back later for more matches!</p>
                  </div>
                ) : (
                  <div className="relative h-full">
                    {[...visibleProfiles]
                      .reverse()
                      .map((profile) => {
                        const isActiveCard = profile.id === visibleProfiles[0]?.id;
                        return (
                        <SwipeCard
                          key={profile.id}
                          profile={profile}
                          onSwipe={handleSwipe}
                          actionSwipe={isActiveCard ? swipeAction : null}
                          style={{
                            zIndex: isActiveCard ? 10 : 5,
                            scale: isActiveCard ? 1 : 0.95,
                          }}
                        />
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="shrink-0 bg-[#080912] px-6 pb-2 pt-4">
                {currentProfileIndex < filteredProfiles.length && (
                  <ActionButtons onPass={handlePass} onLike={handleLike} disabled={swipeAnimating} />
                )}
              </div>
            </div>
          )}

          {currentTab === "community" && (
            <CommunityView
              isPremium={isPremium}
              userInterests={profile.interests}
              userZodiac={profile.zodiacSign || "Leo"} // Fallback if not set
              userId={myUserId}
              joinedCommunities={profile.communities || []}
              onCommunityJoined={handleCommunityJoined}
              onUpgradeToPremium={() => setShowPremiumModal(true)}
              onProfileClick={() => {
                // CommunityView owns the public-profile sheet. A match popup
                // is reserved for the server-confirmed mutual-like response.
              }}
              onLikeProfile={persistLike}
            />
          )}

          {currentTab === "messages" && (
            <>
              {selectedChatId && selectedMatch ? (
                <ChatView
                  match={selectedMatch}
                  myUserId={myUserId}
                  token={authToken || ""}
                  onBack={() => setSelectedChatId(null)}
                />
              ) : (
                <ChatList
                  matches={matches}
                  onSelectChat={setSelectedChatId}
                />
              )}
            </>
          )}

          {currentTab === "profile" && (
            <>
              {showSettings ? (
                <SettingsPage
                  onBack={() => setShowSettings(false)}
                  onChangeEmail={openChangeEmail}
                  onChangePhone={() => {
                    setShowSettings(false);
                    setShowChangePhone(true);
                  }}
                  onTerms={() => {
                    setShowSettings(false);
                    setShowTerms(true);
                  }}
                  onDeleteAccount={() => {
                    setShowSettings(false);
                    setShowDeleteAccount(true);
                  }}
                  onLogout={() => {
                    handleLogout();
                    setShowSettings(false);
                  }}
                  isPremium={isPremium}
                />
              ) : (
                <ProfileView
                  profile={profile}
                  onSettings={() => setShowSettings(true)}
                  onEditProfile={openEditProfile}
                  onProfileUpdate={(updates) => setProfile((prev) => ({ ...prev, ...updates }))}
                />
              )}
            </>
          )}
          
          {currentTab === "likes" && (
            <LikesView
              likedByYou={likedByYou}
              likedYou={likedYou}
              matchedProfiles={matchedProfiles}
              matchesLoading={matchesLoading}
              matchesError={matchesError}
              isPremium={isPremium}
              dailyLikesCount={dailyLikesCount}
              dailyLikesLimit={dailyLikesLimit}
              nextFreeReveal={nextFreeReveal}
              onUpgradeToPremium={() => setShowPremiumModal(true)}
              onProfileClick={() => {
                // LikesView owns the profile detail sheet. Avoid stacking the
                // match popup on top of it when a match card is selected.
              }}
              onLikeBack={async (profile) => {
                const liked = await persistLike({
                  id: profile.id,
                  name: profile.name,
                  age: profile.age,
                  bio: profile.bio || "",
                  location: profile.location,
                  occupation: profile.occupation || "",
                  education: profile.education || "",
                  images: profile.images?.length ? profile.images : [profile.image],
                  interests: profile.interests || [],
                  prompts: profile.prompts || [],
                });
                if (!liked) return false;
                setLikedYou((prev) =>
                  prev.map((p) =>
                    p.id === profile.id ? { ...p, likedYouBack: true } : p
                  )
                );
                return true;
              }}
              onOpenMatchChat={openMatchedChat}
            />
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="border-t border-[#d89075]/30 bg-[#070711]">
          <div className="flex">
            <button
              onClick={() => {
                setCurrentTab("profile");
                setSelectedChatId(null);
              }}
              className={`flex-1 py-4 flex flex-col items-center gap-1 transition-colors ${
                currentTab === "profile"
                  ? "text-[#ffd9aa]"
                  : "text-white/45 hover:text-white/75"
              }`}
            >
              <User className="w-6 h-6" />
              <span className="text-xs">Profile</span>
            </button>
            <button
              onClick={() => {
                setCurrentTab("swipe");
                setSelectedChatId(null);
              }}
              className={`flex-1 py-4 flex flex-col items-center gap-1 transition-colors ${
                currentTab === "swipe"
                  ? "text-[#ffd9aa]"
                  : "text-white/45 hover:text-white/75"
              }`}
            >
              <Heart className="w-6 h-6" />
              <span className="text-xs">Discover</span>
            </button>
            <button
              onClick={() => {
                setCurrentTab("community");
                setSelectedChatId(null);
              }}
              className={`flex-1 py-4 flex flex-col items-center gap-1 transition-colors ${
                currentTab === "community"
                  ? "text-[#ffd9aa]"
                  : "text-white/45 hover:text-white/75"
              }`}
            >
              <Users className="w-6 h-6" />
              <span className="text-xs">Community</span>
            </button>
            <button
              onClick={() => {
                setCurrentTab("likes");
                setSelectedChatId(null);
                void syncDailyLikes();
              }}
              className={`flex-1 py-4 flex flex-col items-center gap-1 transition-colors ${
                currentTab === "likes"
                  ? "text-[#ffd9aa]"
                  : "text-white/45 hover:text-white/75"
              }`}
            >
              <ThumbsUp className="w-6 h-6" />
              <span className="text-xs">Likes</span>
            </button>
            <button
              onClick={() => {
                setCurrentTab("messages");
                setSelectedChatId(null);
              }}
              className={`flex-1 py-4 flex flex-col items-center gap-1 transition-colors relative ${
                currentTab === "messages"
                  ? "text-[#ffd9aa]"
                  : "text-white/45 hover:text-white/75"
              }`}
            >
              <MessageCircle className="w-6 h-6" />
              <span className="text-xs">Messages</span>
              {matches.some((m) => m.unread) && (
                <div className="absolute top-3 right-1/2 translate-x-3 w-2 h-2 bg-[#ff3f7f] rounded-full" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Match Modal */}
      <MatchModal
        isOpen={showMatchModal}
        profile={matchedProfile}
        onClose={() => setShowMatchModal(false)}
        onKeepSwiping={() => {
          setShowMatchModal(false);
          setSelectedChatId(null);
          setCurrentTab("swipe");
        }}
        onSendMessage={handleSendMessage}
      />
      
      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={showEditProfile}
        profile={profile}
        onClose={() => setShowEditProfile(false)}
        onSave={async (updatedProfile) => {
          if (!navigator.onLine) {
            setToast("No internet connection. Changes were not saved.");
            return;
          }
          const approxBirthYear = new Date().getFullYear() - (updatedProfile.age || 25);
          await updateMyProfile({
            name: updatedProfile.name.slice(0, 40),
            gender: updatedProfile.gender,
            lookingFor: updatedProfile.preference,
            bio: updatedProfile.bio.slice(0, 180),
            city: updatedProfile.location,
            country: updatedProfile.country,
            occupation: updatedProfile.occupation,
            education: updatedProfile.education,
            ethnicity: updatedProfile.ethnicity,
            religion: updatedProfile.religion,
            heightCm: updatedProfile.heightCm,
            zodiacSign: updatedProfile.zodiacSign,
            prompts: updatedProfile.prompts || [],
            // Preserve an already-uploaded video (or clear it when removed).
            // A newly picked file is uploaded immediately below instead.
            videoUrl: (updatedProfile as any).videoFile ? undefined : updatedProfile.video || null,
            dob: new Date(approxBirthYear, 0, 1).toISOString(),
          });
          await apiSetInterests(updatedProfile.interests || []);
          const newPhotoFiles = (updatedProfile as any).photoFiles || [];
          if (newPhotoFiles.length) {
            const availableSlots = Math.max(0, 5 - (profile.photoIds?.length || profile.images.length));
            for (const file of newPhotoFiles.slice(0, availableSlots)) await uploadPhoto(file);
          }
          if ((updatedProfile as any).videoFile) {
            await uploadPhoto((updatedProfile as any).videoFile);
          }
          const refreshed = await getMyProfile();
          setProfile((prev) => ({ ...prev, ...mapUserToProfile(refreshed.user) } as any));
          setEmail(refreshed.user.email || "");
          setPhone(refreshed.user.phone || "");
          setToast("Profile updated successfully.");
          window.setTimeout(() => setShowEditProfile(false), 1200);
        }}
        onDeletePhoto={async (photoId) => {
          await deleteProfilePhoto(photoId);
          setProfile((current: any) => {
            const index = (current.photoIds || []).indexOf(photoId);
            return {
              ...current,
              photoIds: (current.photoIds || []).filter((id: string) => id !== photoId),
              images: current.images.filter((_: string, imageIndex: number) => imageIndex !== index),
            };
          });
        }}
      />
      
      {/* Change Email Modal */}
      <ChangeEmailModal
        isOpen={showChangeEmail}
        currentEmail={email}
        isLoading={emailLoading}
        onClose={() => {
          setShowChangeEmail(false);
          setShowSettings(true);
        }}
        onSave={async (newEmail) => {
          await updateMyProfile({ email: newEmail });
          setEmail(newEmail);
        }}
      />
      
      {/* Change Phone Modal */}
      <ChangePhoneModal
        isOpen={showChangePhone}
        currentPhone={phone}
        onClose={() => {
          setShowChangePhone(false);
          setShowSettings(true);
        }}
        onSave={(newPhone) => {
          setPhone(newPhone);
        }}
      />
      
      {/* Terms Modal */}
      <TermsModal
        isOpen={showTerms}
        onClose={() => {
          setShowTerms(false);
          setShowSettings(true);
        }}
      />
      
      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteAccount}
        onClose={() => {
          setShowDeleteAccount(false);
          setShowSettings(true);
        }}
        onConfirm={async () => {
      await deleteMyAccount().catch(() => null);
      if (myUserId) localStorage.removeItem(getSentLikesCacheKey(myUserId));
      setShowDeleteAccount(false);
      handleLogout();
    }}
      />
      
      {/* Premium Modal */}
      <PremiumModal
        isOpen={showPremiumModal}
        country={filters.country || profile.country}
        onClose={() => setShowPremiumModal(false)}
        onUpgrade={async (plan) => {
          await handleRequiredSubscription(plan);
          setShowPremiumModal(false);
        }}
      />
      
      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        userName={reportedProfile?.name || ""}
        onClose={() => setShowReportModal(false)}
        onReport={() => {
          console.log("Profile reported");
          setShowReportModal(false);
        }}
      />
    </div>
  );
}
