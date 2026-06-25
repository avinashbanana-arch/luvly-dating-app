import { useEffect, useState } from "react";
import { Heart, MessageCircle, User, ThumbsUp, Users } from "lucide-react";
import { SwipeCard, ActionButtons, Profile } from "./components/SwipeCard";
import { MatchModal } from "./components/MatchModal";
import { ChatList, Match } from "./components/ChatList";
import { ChatView } from "./components/ChatView";
import { ProfileView } from "./components/ProfileView";
import { LoginPage } from "./components/LoginPage";
import { ProfileSetup } from "./components/ProfileSetup";
import {
  getToken,
  clearToken,
  getMyProfile,
  updateMyProfile,
  uploadPhoto,
  setInterests as apiSetInterests,
  getDiscoverFeed,
  getMyMatches,
  likeUser,
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
import { detectCountryFromLocale } from "../lib/countries";
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
  zodiacSign: "Leo",
  interests: ["Technology", "Travel", "Photography", "Fitness", "Music", "Food"],
  prompts: [
    { question: "My ideal Sunday", answer: "Exploring new cafes and hiking trails" },
    { question: "I geek out on", answer: "Latest tech gadgets and design trends" },
  ],
};

type AppScreen = "login" | "setup" | "subscribe" | "main";

// Converts a backend user record (from /api/match/discover, /api/profile/me, etc.)
// into the `Profile` shape the existing UI components expect.
function mapUserToProfile(u: any): Profile {
  const ageFromDob = (dob: string | null) => {
    if (!dob) return 18;
    const diff = Date.now() - new Date(dob).getTime();
    return Math.max(18, Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000)));
  };
  return {
    id: u.id,
    name: u.name || "New user",
    age: ageFromDob(u.dob),
    bio: u.bio || "",
    location: u.city || "Nearby",
    occupation: u.occupation || "",
    country: u.country || "",
    images:
      u.photos && u.photos.length > 0
        ? u.photos.map((p: any) => p.url)
        : [`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`],
    interests: (u.interests || []).map((i: any) => i.interest?.name || i.name).filter(Boolean),
  };
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("login");
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string>("");
  const [discoverProfiles, setDiscoverProfiles] = useState<Profile[]>([]);
  const [appLoading, setAppLoading] = useState(true);
  const [appError, setAppError] = useState("");
  const [currentTab, setCurrentTab] = useState<"profile" | "swipe" | "community" | "likes" | "messages">(
    "profile"
  );
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
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
  const [email, setEmail] = useState("user@example.com");
  const [phone, setPhone] = useState("+1 (555) 123-4567");
  
  // Likes system states
  const [likedByYou, setLikedByYou] = useState<LikedProfile[]>([]);
  const [likedYou, setLikedYou] = useState<LikedProfile[]>([
    // Mock data - people who liked you
    {
      id: "1",
      name: "Sarah",
      age: 26,
      image: "https://images.unsplash.com/photo-1594318223885-20dc4b889f9e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHdvbWFuJTIwc21pbGluZ3xlbnwxfHx8fDE3Njc4ODk3NzN8MA&ixlib=rb-4.1.0&q=80&w=1080",
      location: "San Francisco, CA",
      likedYouBack: false,
      timestamp: "2 hours ago",
    },
    {
      id: "3",
      name: "Emma",
      age: 24,
      image: "https://images.unsplash.com/photo-1546961329-78bef0414d7c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHlvdW5nJTIwd29tYW58ZW58MXx8fHwxNzY3ODIxNzc1fDA&ixlib=rb-4.1.0&q=80&w=1080",
      location: "Los Angeles, CA",
      likedYouBack: false,
      timestamp: "5 hours ago",
    },
    {
      id: "5",
      name: "Olivia",
      age: 27,
      image: "https://images.unsplash.com/photo-1623594675959-02360202d4d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHdvbWFuJTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc2NzgyMDcyM3ww&ixlib=rb-4.1.0&q=80&w=1080",
      location: "New York, NY",
      likedYouBack: false,
      timestamp: "1 day ago",
    },
  ]);
  const [isPremium, setIsPremium] = useState(false);
  const [dailyLikesCount, setDailyLikesCount] = useState(0);
  const [dailyLikesLimit] = useState(50);
  const [nextFreeReveal, setNextFreeReveal] = useState<Date | null>(
    new Date(Date.now() + 3600000) // 1 hour from now
  );
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportedProfile, setReportedProfile] = useState<Profile | null>(null);

  // ---------- Real backend data loading ----------

  const loadMainData = async () => {
    setAppLoading(true);
    setAppError("");
    try {
      const meRes = await getMyProfile();
      setMyUserId(meRes.user.id);
      setIsPremium(!!meRes.user.isPremium);
      setProfile((prev) => ({ ...prev, ...mapUserToProfile(meRes.user) } as any));

      if (!meRes.user.name) {
        setCurrentScreen("setup");
        return;
      }

      if (!meRes.access?.hasActiveAccess) {
        setCurrentScreen("subscribe");
        return;
      }

      const [discoverRes, matchesRes] = await Promise.all([
        getDiscoverFeed(filters.country),
        getMyMatches(),
      ]);

      setDiscoverProfiles((discoverRes.candidates || []).map(mapUserToProfile));
      setCurrentProfileIndex(0);
      setMatches(
        (matchesRes.matches || []).map((m: any) => ({
          id: m.matchId,
          name: m.otherUser?.name || "Match",
          image:
            m.otherUser?.photos?.[0]?.url ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.otherUser?.id}`,
          lastMessage: "Tap to start chatting",
          timestamp: new Date(m.createdAt).toLocaleDateString(),
          unread: false,
        }))
      );
      setCurrentScreen("main");
    } catch (err) {
      if (err instanceof ApiError && err.code === "PREMIUM_REQUIRED") {
        setCurrentScreen("subscribe");
        setAppError("");
        return;
      }
      setAppError(err instanceof ApiError ? err.message : "Couldn't reach the backend. Is it running?");
    } finally {
      setAppLoading(false);
    }
  };

  // On first load, if we already have a saved token, try to resume the session.
  useEffect(() => {
    const existing = getToken();
    if (!existing) {
      setAppLoading(false);
      return;
    }
    setAuthToken(existing);
    getMyProfile()
      .then((meRes) => {
        setMyUserId(meRes.user.id);
        setIsPremium(!!meRes.user.isPremium);
        if (!meRes.user.name) {
          setCurrentScreen("setup");
          setAppLoading(false);
          return;
        }
        if (!meRes.access?.hasActiveAccess) {
          setCurrentScreen("subscribe");
          setAppLoading(false);
          return;
        }
        loadMainData();
      })
      .catch(() => {
        clearToken();
        setAppLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAuthenticated = (isNewUser: boolean) => {
    const token = getToken();
    setAuthToken(token);
    if (isNewUser) {
      setCurrentScreen("setup");
    } else {
      loadMainData();
    }
  };

  const handleProfileSetupComplete = async (data: any) => {
    setAppLoading(true);
    try {
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

      await updateMyProfile({
        name: data.name,
        gender: genderMap[data.gender] || undefined,
        lookingFor: data.preference,
        bio: data.bio,
        city: data.location,
        country: data.country,
        latitude: data.latitude,
        longitude: data.longitude,
        dob: new Date(approxBirthYear, 0, 1).toISOString(),
      });
      if (data.interests?.length) {
        await apiSetInterests(data.interests);
      }
      if (data.photoFiles?.length) {
        await Promise.all(data.photoFiles.map((file: File) => uploadPhoto(file)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      const meRes = await getMyProfile().catch(() => null);
      if (meRes?.access?.hasActiveAccess) {
        await loadMainData();
      } else {
        setCurrentScreen("subscribe");
        setAppLoading(false);
      }
    }
  };

  const handleRequiredSubscription = async (plan: "MONTHLY" | "YEARLY") => {
    const purchaseResult = await purchaseMobileSubscription(myUserId, plan);
    if (purchaseResult.usedStore) {
      await syncRevenueCatSubscription();
    } else {
      await startTrialSubscription(plan, filters.country || profile.country);
    }
    setIsPremium(true);
    const meRes = await getMyProfile();
    if (!meRes.user.name) {
      setCurrentScreen("setup");
      return;
    }
    await loadMainData();
  };

  const handleLogout = () => {
    clearToken();
    disconnectSocket();
    setAuthToken(null);
    setMyUserId("");
    setDiscoverProfiles([]);
    setMatches([]);
    setCurrentScreen("login");
  };

  const handleSwipe = async (direction: "left" | "right") => {
    const currentProfile = filteredProfiles[currentProfileIndex];
    if (!currentProfile) return;

    if (direction === "right") {
      try {
        const result = await likeUser(currentProfile.id);

        // Add to liked by you list
        const likedProfile: LikedProfile = {
          id: currentProfile.id,
          name: currentProfile.name,
          age: currentProfile.age,
          image: currentProfile.images[0],
          location: currentProfile.location,
          likedYouBack: !!result.match,
          timestamp: "Just now",
        };
        setLikedByYou((prev) => [likedProfile, ...prev]);

        if (!isPremium) setDailyLikesCount((prev) => prev + 1);

        // Real mutual match, confirmed by the backend
        if (result.match) {
          setMatchedProfile(currentProfile);
          setShowMatchModal(true);

          setMatches((prev) => [
            {
              id: result.match.id,
              name: currentProfile.name,
              image: currentProfile.images[0],
              lastMessage: "Tap to start chatting",
              timestamp: "Just now",
              unread: true,
            },
            ...prev,
          ]);
        }
      } catch (err) {
        alert(err instanceof ApiError ? err.message : "Couldn't like this profile.");
        return; // don't advance the deck if the request failed
      }
    }

    // Move to next profile
    setCurrentProfileIndex((prev) => prev + 1);
  };

  const handlePass = () => handleSwipe("left");
  const handleLike = () => handleSwipe("right");

  const handleApplyFilters = async (nextFilters: typeof filters) => {
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

  const handleSendMessage = () => {
    setShowMatchModal(false);
    setCurrentTab("messages");
    if (matches.length > 0) {
      setSelectedChatId(matches[0].id);
    }
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

  // Auth and setup flow
  if (currentScreen === "login") {
    return (
      <div className="h-screen bg-gray-50">
        <LoginPage onLogin={handleAuthenticated} />
      </div>
    );
  }

  if (currentScreen === "setup") {
    return (
      <div className="h-screen bg-gray-50">
        <ProfileSetup onComplete={handleProfileSetupComplete} />
      </div>
    );
  }

  if (currentScreen === "subscribe") {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center p-4">
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

  if (appLoading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-12 h-12 text-pink-500 fill-current animate-pulse mx-auto mb-3" />
          <p className="text-gray-500">Loading your matches...</p>
        </div>
      </div>
    );
  }

  if (appError) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <p className="text-red-500 mb-4">{appError}</p>
          <button
            onClick={loadMainData}
            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Main app
  return (
    <div className="h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md h-full max-h-[800px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {currentTab === "swipe" && (
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-6 flex items-center justify-between border-b">
                <div className="flex items-center">
                  <Heart className="w-8 h-8 text-pink-500 fill-current" />
                  <h1 className="text-2xl ml-2 bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent">
                    Luvly
                  </h1>
                </div>
                <DiscoverFilters filters={filters} onApply={handleApplyFilters} />
              </div>

              {/* Swipe Cards */}
              <div className="flex-1 p-6 relative">
                {currentProfileIndex >= filteredProfiles.length ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <Heart className="w-16 h-16 mb-4" />
                    <p className="text-lg">No more profiles</p>
                    <p className="text-sm">Check back later for more matches!</p>
                  </div>
                ) : (
                  <div className="relative h-full">
                    {filteredProfiles
                      .slice(currentProfileIndex, currentProfileIndex + 2)
                      .reverse()
                      .map((profile, index) => (
                        <SwipeCard
                          key={profile.id}
                          profile={profile}
                          onSwipe={handleSwipe}
                          style={{
                            zIndex: index === 1 ? 10 : 5,
                            scale: index === 1 ? 1 : 0.95,
                          }}
                        />
                      ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {currentProfileIndex < filteredProfiles.length && (
                <ActionButtons onPass={handlePass} onLike={handleLike} />
              )}
            </div>
          )}

          {currentTab === "community" && (
            <CommunityView
              isPremium={isPremium}
              userInterests={profile.interests}
              userZodiac={profile.zodiacSign || "Leo"} // Fallback if not set
              onUpgradeToPremium={() => setShowPremiumModal(true)}
              onProfileClick={(profile) => {
                // Show profile details or match modal
                setMatchedProfile({
                  ...profile,
                  images: profile.images || [], // Ensure images array exists
                  interests: profile.interests || [],
                });
                setShowMatchModal(true);
              }}
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
                  onChangeEmail={() => {
                    setShowSettings(false);
                    setShowChangeEmail(true);
                  }}
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
                  onEditProfile={() => setShowEditProfile(true)}
                  onProfileUpdate={(updates) => setProfile((prev) => ({ ...prev, ...updates }))}
                />
              )}
            </>
          )}
          
          {currentTab === "likes" && (
            <LikesView
              likedByYou={likedByYou}
              likedYou={likedYou}
              isPremium={isPremium}
              dailyLikesCount={dailyLikesCount}
              dailyLikesLimit={dailyLikesLimit}
              nextFreeReveal={nextFreeReveal}
              onUpgradeToPremium={() => setShowPremiumModal(true)}
              onProfileClick={(profile) => {
                // Navigate to profile or open in modal
                console.log("Clicked profile:", profile);
              }}
              onLikeBack={(profile) => {
                // Check daily limit
                if (dailyLikesCount >= dailyLikesLimit && !isPremium) {
                  alert("Daily like limit reached! Upgrade to Premium for unlimited likes.");
                  return;
                }

                // Increment daily likes counter
                if (!isPremium) {
                  setDailyLikesCount((prev) => prev + 1);
                }

                // Mark as mutual match
                setLikedYou((prev) =>
                  prev.map((p) =>
                    p.id === profile.id ? { ...p, likedYouBack: true } : p
                  )
                );

                // Add to matches
                setMatches((prev) => [
                  {
                    id: profile.id,
                    name: profile.name,
                    image: profile.image,
                    lastMessage: `You matched with ${profile.name}!`,
                    timestamp: "Just now",
                    unread: true,
                  },
                  ...prev,
                ]);

                // Show match modal
                setMatchedProfile({
                  id: profile.id,
                  name: profile.name,
                  age: profile.age,
                  bio: "",
                  location: profile.location,
                  occupation: "",
                  images: [profile.image],
                  interests: [],
                });
                setShowMatchModal(true);
              }}
            />
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="border-t bg-white">
          <div className="flex">
            <button
              onClick={() => {
                setCurrentTab("profile");
                setSelectedChatId(null);
              }}
              className={`flex-1 py-4 flex flex-col items-center gap-1 transition-colors ${
                currentTab === "profile"
                  ? "text-pink-500"
                  : "text-gray-400 hover:text-gray-600"
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
                  ? "text-pink-500"
                  : "text-gray-400 hover:text-gray-600"
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
                  ? "text-pink-500"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Users className="w-6 h-6" />
              <span className="text-xs">Community</span>
            </button>
            <button
              onClick={() => {
                setCurrentTab("likes");
                setSelectedChatId(null);
              }}
              className={`flex-1 py-4 flex flex-col items-center gap-1 transition-colors ${
                currentTab === "likes"
                  ? "text-pink-500"
                  : "text-gray-400 hover:text-gray-600"
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
                  ? "text-pink-500"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <MessageCircle className="w-6 h-6" />
              <span className="text-xs">Messages</span>
              {matches.some((m) => m.unread) && (
                <div className="absolute top-3 right-1/2 translate-x-3 w-2 h-2 bg-pink-500 rounded-full" />
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
        onSendMessage={handleSendMessage}
      />
      
      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={showEditProfile}
        profile={profile}
        onClose={() => setShowEditProfile(false)}
        onSave={(updatedProfile) => {
          setProfile(updatedProfile);
          setShowEditProfile(false);
        }}
      />
      
      {/* Change Email Modal */}
      <ChangeEmailModal
        isOpen={showChangeEmail}
        currentEmail={email}
        onClose={() => setShowChangeEmail(false)}
        onSave={(newEmail) => {
          setEmail(newEmail);
          setShowChangeEmail(false);
        }}
      />
      
      {/* Change Phone Modal */}
      <ChangePhoneModal
        isOpen={showChangePhone}
        currentPhone={phone}
        onClose={() => setShowChangePhone(false)}
        onSave={(newPhone) => {
          setPhone(newPhone);
          setShowChangePhone(false);
        }}
      />
      
      {/* Terms Modal */}
      <TermsModal
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
      />
      
      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteAccount}
        onClose={() => setShowDeleteAccount(false)}
        onConfirm={() => {
          // Note: the backend doesn't have a delete-account endpoint yet,
          // this just logs the user out locally.
          handleLogout();
          setShowDeleteAccount(false);
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
