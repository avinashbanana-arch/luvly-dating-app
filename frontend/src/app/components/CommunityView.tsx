import { useEffect, useState } from "react";
import { PublicProfileDetails } from "./PublicProfileDetails";
import { Users, Lock, ChevronRight, ArrowLeft, Star, Music, Plane, Dumbbell, Book, Atom, Film, Trophy, CheckCircle, Plus, Heart, X } from "lucide-react";
import { Profile } from "./SwipeCard";
import { API_URL, getCommunityFeed } from "../../lib/api";

interface CommunityViewProps {
  isPremium: boolean;
  onUpgradeToPremium: () => void;
  onProfileClick: (profile: Profile) => void;
  onLikeProfile: (profile: Profile) => Promise<boolean> | boolean;
  userId: string;
  joinedCommunities: string[];
  onCommunityJoined: (communities: string[]) => void;
  userInterests: string[];
  userZodiac: string;
}

const COMMUNITY_DISMISSED_PROFILES_KEY = "luvly_community_dismissed_profiles";

const communities = [
  { id: "music", name: "Music", icon: Music, color: "bg-purple-100 text-purple-600" },
  { id: "travelling", name: "Travelling", icon: Plane, color: "bg-blue-100 text-blue-600", interestMatch: "Travel" },
  { id: "gym", name: "Gym", icon: Dumbbell, color: "bg-red-100 text-red-600" },
  { id: "books", name: "Books", icon: Book, color: "bg-yellow-100 text-yellow-600" },
  { id: "science", name: "Science", icon: Atom, color: "bg-green-100 text-green-600" },
  { id: "dance", name: "Dance", icon: Users, color: "bg-pink-100 text-pink-600" },
  { id: "movies", name: "Movies", icon: Film, color: "bg-indigo-100 text-indigo-600" },
  { id: "sports", name: "Sports", icon: Trophy, color: "bg-orange-100 text-orange-600" },
  { id: "astrology", name: "Astrology", icon: Star, color: "bg-violet-100 text-violet-600" },
];

const zodiacSigns = [
  { value: "Aries", symbol: "♈", dates: "Mar 21 - Apr 19" },
  { value: "Taurus", symbol: "♉", dates: "Apr 20 - May 20" },
  { value: "Gemini", symbol: "♊", dates: "May 21 - Jun 20" },
  { value: "Cancer", symbol: "♋", dates: "Jun 21 - Jul 22" },
  { value: "Leo", symbol: "♌", dates: "Jul 23 - Aug 22" },
  { value: "Virgo", symbol: "♍", dates: "Aug 23 - Sep 22" },
  { value: "Libra", symbol: "♎", dates: "Sep 23 - Oct 22" },
  { value: "Scorpio", symbol: "♏", dates: "Oct 23 - Nov 21" },
  { value: "Sagittarius", symbol: "♐", dates: "Nov 22 - Dec 21" },
  { value: "Capricorn", symbol: "♑", dates: "Dec 22 - Jan 19" },
  { value: "Aquarius", symbol: "♒", dates: "Jan 20 - Feb 18" },
  { value: "Pisces", symbol: "♓", dates: "Feb 19 - Mar 20" },
];
function mapCommunityUser(user: any): Profile {
  const photoHost = API_URL.replace(/\/api\/?$/, "");
  const imageUrl = (value: unknown) => {
    const url = String(value || "").trim();
    if (!url || url === "null" || url === "undefined") return "";
    return /^(https?:|data:|blob:)/i.test(url) ? url : `${photoHost}${url.startsWith("/") ? "" : "/"}${url}`;
  };
  const age = user.dob
    ? Math.max(18, Math.floor((Date.now() - new Date(user.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)))
    : 18;
  const images = Array.isArray(user.photos)
    ? user.photos.map((photo: any) => imageUrl(photo?.url || photo)).filter(Boolean)
    : [];
  const fallbackImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.id)}`;

  return {
    id: user.id,
    name: user.name || "Luvly member",
    age,
    bio: user.bio || "",
    location: user.city || user.country || "Location not set",
    occupation: user.occupation || user.jobTitle || "",
    education: user.education || "",
    gender: user.gender || "",
    preference: user.lookingFor || "",
    zodiacSign: user.zodiacSign || "",
    communities: user.communities || [],
    images: images.length ? images : [fallbackImage],
    interests: (user.interests || []).map((item: any) => item.interest?.name || item.name).filter(Boolean),
    prompts: Array.isArray(user.prompts) ? user.prompts : [],
    isVerified: !!user.isVerified,
  };
}

function CommunityProfileGrid({
  profiles,
  loading,
  error,
  onOpenProfile,
}: {
  profiles: Profile[];
  loading: boolean;
  error: string;
  onOpenProfile: (profile: Profile) => void;
}) {
  if (loading) {
    return <p className="py-10 text-center text-sm text-white/60">Loading community members…</p>;
  }
  if (error) {
    return <p className="rounded-xl border border-[#ff9caf]/35 bg-[#ff9caf]/10 p-4 text-center text-sm text-[#ffd9aa]">{error}</p>;
  }
  if (!profiles.length) {
    return <p className="py-10 text-center text-sm text-white/60">No members are available here yet. Invite someone to join this community.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-4">
      {profiles.map((profile) => (
        <button
          key={profile.id}
          type="button"
          onClick={() => onOpenProfile(profile)}
          className="overflow-hidden rounded-2xl bg-white text-left shadow-md transition-shadow hover:shadow-lg"
        >
          <div className="relative h-40">
            <img src={profile.images[0]} alt={profile.name} className="h-full w-full object-cover" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <h3 className="font-bold text-white">{profile.name}, {profile.age}</h3>
            </div>
          </div>
          <div className="p-3"><p className="line-clamp-2 text-xs text-gray-500">{profile.bio}</p></div>
        </button>
      ))}
    </div>
  );
}

function getDismissedProfilesCacheKey(userId: string) {
  return `${COMMUNITY_DISMISSED_PROFILES_KEY}_${userId || "anonymous"}`;
}

function readDismissedProfilesCache(userId: string): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(getDismissedProfilesCacheKey(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeDismissedProfilesCache(userId: string, dismissedProfiles: Record<string, string[]>) {
  try {
    localStorage.setItem(getDismissedProfilesCacheKey(userId), JSON.stringify(dismissedProfiles));
  } catch {
    // Ignore storage errors; in-memory state still keeps the current session correct.
  }
}

function getCommunityFeedKey(communityId: string | null, zodiac: string | null) {
  if (zodiac) return `astrology:${zodiac}`;
  return communityId || "";
}

export function CommunityView({
  isPremium,
  onUpgradeToPremium,
  onProfileClick,
  onLikeProfile,
  userId,
  joinedCommunities: persistedJoinedCommunities,
  onCommunityJoined,
  userInterests,
  userZodiac,
}: CommunityViewProps) {
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [selectedZodiac, setSelectedZodiac] = useState<string | null>(null);
  const [joinedCommunities, setJoinedCommunities] = useState<string[]>(persistedJoinedCommunities);
  const [joiningCommunityId, setJoiningCommunityId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [selectedProfileImageIndex, setSelectedProfileImageIndex] = useState(0);
  const [communityProfiles, setCommunityProfiles] = useState<Profile[]>([]);
  const [communityFeedLoading, setCommunityFeedLoading] = useState(false);
  const [communityFeedError, setCommunityFeedError] = useState("");
  const [dismissedProfiles, setDismissedProfiles] = useState<Record<string, string[]>>(() =>
    readDismissedProfilesCache(userId)
  );

  useEffect(() => {
    setJoinedCommunities(persistedJoinedCommunities.slice(0, 1));
  }, [persistedJoinedCommunities]);

  useEffect(() => {
    setDismissedProfiles(readDismissedProfilesCache(userId));
  }, [userId]);

  useEffect(() => {
    // The Communities landing page and the astrology sign selector do not
    // have a feed yet. Every actual member card below is loaded from the API,
    // never from the old c1/c2 demo data.
    if (!selectedCommunity || (selectedCommunity === "astrology" && !selectedZodiac)) {
      setCommunityProfiles([]);
      setCommunityFeedError("");
      return;
    }

    let cancelled = false;
    setCommunityFeedLoading(true);
    setCommunityFeedError("");
    void getCommunityFeed(selectedCommunity, selectedZodiac || undefined)
      .then((result) => {
        if (!cancelled) setCommunityProfiles((result.candidates || []).map(mapCommunityUser));
      })
      .catch((error) => {
        if (!cancelled) {
          setCommunityProfiles([]);
          setCommunityFeedError(error instanceof Error ? error.message : "Couldn't load community members.");
        }
      })
      .finally(() => {
        if (!cancelled) setCommunityFeedLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCommunity, selectedZodiac]);

  const joinCommunity = (id: string) => {
    if (!isPremium) {
      onUpgradeToPremium();
      return;
    }
    if (joinedCommunities.includes(id)) {
      setSelectedCommunity(id);
      return;
    }
    // Membership is included with the user's subscription. A person may have
    // exactly one active community; joining another switches membership.
    const nextCommunities = [id];
    setJoinedCommunities(nextCommunities);
    onCommunityJoined(nextCommunities);
    setSelectedCommunity(id);
  };

  const openProfile = (profile: Profile) => {
    setSelectedProfile(profile);
    setSelectedProfileImageIndex(0);
  };

  const handleCommunityClick = (id: string) => {
    if (!isPremium) {
      onUpgradeToPremium();
      return;
    }
    if (!isMember(id)) {
      joinCommunity(id);
      return;
    }
    
    // For astrology, we want to show the zodiac selection even if they are joined
    // Or if the requirement is to auto-join based on zodiac, we can pre-select their zodiac
    if (id === "astrology") {
        setSelectedCommunity(id);
        // Automatically select user's zodiac if they click astrology? 
        // The prompt says "astrology section have subsection which will have all the zodic sign"
        // So we keep the submenu, but maybe highlight theirs.
    } else {
        setSelectedCommunity(id);
    }
  };

  const handleBack = () => {
    if (selectedZodiac) {
      setSelectedZodiac(null);
    } else {
      setSelectedCommunity(null);
    }
  };

  const isMember = (communityId: string) => {
    return joinedCommunities.includes(communityId);
  };

  const hideProfileFromCurrentFeed = (profileId: string) => {
    const feedKey = getCommunityFeedKey(selectedCommunity, selectedZodiac);
    if (!feedKey) return;

    setDismissedProfiles((current) => {
      const currentFeedProfiles = current[feedKey] || [];
      const next = {
        ...current,
        [feedKey]: currentFeedProfiles.includes(profileId)
          ? currentFeedProfiles
          : [...currentFeedProfiles, profileId],
      };
      writeDismissedProfilesCache(userId, next);
      return next;
    });
  };

  const renderContent = () => {
    if (selectedZodiac) {
      const feedKey = getCommunityFeedKey(selectedCommunity, selectedZodiac);
      const visibleProfiles = communityProfiles.filter(
        (profile) => !dismissedProfiles[feedKey]?.includes(profile.id)
      );
      return (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-3xl">
              {zodiacSigns.find((z) => z.value === selectedZodiac)?.symbol}
            </span>
            <h2 className="text-2xl font-bold">{selectedZodiac} Singles</h2>
            {userZodiac === selectedZodiac && (
                <span className="bg-pink-100 text-pink-600 text-xs px-2 py-1 rounded-full font-medium">
                    Your Sign
                </span>
            )}
          </div>
          <CommunityProfileGrid
            profiles={visibleProfiles}
            loading={communityFeedLoading}
            error={communityFeedError}
            onOpenProfile={openProfile}
          />
        </div>
      );
    }

    if (selectedCommunity === "astrology") {
      return (
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Choose a Zodiac Sign</h2>
            <div className="text-sm text-pink-600 font-medium bg-pink-50 px-3 py-1 rounded-full">
                You are {userZodiac}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {zodiacSigns.map((sign) => (
              <button
                key={sign.value}
                onClick={() => setSelectedZodiac(sign.value)}
                className={`flex flex-col items-center p-3 rounded-xl bg-white shadow-sm border transition-all ${
                    userZodiac === sign.value 
                    ? "border-pink-500 bg-pink-50 ring-2 ring-pink-200" 
                    : "border-gray-100 hover:border-pink-300"
                }`}
              >
                <span className="text-3xl mb-1">{sign.symbol}</span>
                <span className="font-medium text-xs">{sign.value}</span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (selectedCommunity) {
      const community = communities.find((c) => c.id === selectedCommunity);
      const feedKey = getCommunityFeedKey(selectedCommunity, null);
      const visibleProfiles = communityProfiles.filter(
        (profile) => !dismissedProfiles[feedKey]?.includes(profile.id)
      );
      return (
        <div className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">{community?.name} Enthusiasts</h2>
          </div>
          <CommunityProfileGrid
            profiles={visibleProfiles}
            loading={communityFeedLoading}
            error={communityFeedError}
            onOpenProfile={openProfile}
          />
        </div>
      );
    }

    // Default List View
    return (
      <div className="p-4 space-y-3">
        {!isPremium && (
          <div className="bg-gradient-to-r from-pink-500 to-red-500 text-white p-4 rounded-2xl mb-6 shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-1">Premium Communities</h3>
              <p className="text-sm opacity-90 mb-3">
                Join exclusive communities and find people with similar interests.
              </p>
              <button
                onClick={onUpgradeToPremium}
                className="bg-white text-pink-500 px-4 py-2 rounded-full text-sm font-bold shadow-sm"
              >
                Upgrade Now
              </button>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/10 skew-x-12 transform translate-x-4" />
          </div>
        )}

        {communities.map((community) => {
            const joined = isMember(community.id);
            return (
              <button
                key={community.id}
                onClick={() => handleCommunityClick(community.id)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl shadow-sm border transition-all group ${
                    joined ? "bg-white border-pink-200 ring-1 ring-pink-100" : "bg-white border-gray-100"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full ${community.color} flex items-center justify-center relative`}>
                    <community.icon className="w-6 h-6" />
                    {joined && (
                        <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-0.5 border-2 border-white">
                            <CheckCircle className="w-3 h-3" />
                        </div>
                    )}
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        {community.name}
                        {joined && <span className="text-xs font-normal text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full">Joined</span>}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {Math.floor(Math.random() * 500) + 100} members
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isPremium && <Lock className="w-4 h-4 text-gray-400" />}
                  {joined ? (
                    <span className="text-sm font-semibold text-pink-600">Joined</span>
                  ) : (
                    <button
                      type="button"
                      role="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        joinCommunity(community.id);
                      }}
                      disabled={joiningCommunityId === community.id}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-pink-200 text-pink-500 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label={`Join ${community.name}`}
                    >
                      {joiningCommunityId === community.id ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-pink-200 border-t-pink-500" />
                      ) : (
                        <Plus className="h-5 w-5" />
                      )}
                    </button>
                  )}
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
              </button>
            );
        })}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#080912] text-white">
      {/* Header */}
      <div className="p-6 bg-[#080912] border-b border-white/10 flex items-center gap-4 sticky top-0 z-10">
        {(selectedCommunity || selectedZodiac) && (
          <button onClick={handleBack} className="p-2 -ml-2 hover:bg-white/10 rounded-full">
            <ArrowLeft className="w-6 h-6 text-[#ffd9aa]" />
          </button>
        )}
        <div>
          <h1 className="font-serif text-3xl text-[#ffe1ae]">
            Community
          </h1>
          <p className="text-xs text-white/50">
            {selectedZodiac
              ? "Find your zodiac match"
              : selectedCommunity
              ? `Explore ${communities.find(c => c.id === selectedCommunity)?.name}`
              : "Connect with like-minded people"}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>
      {selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={() => setSelectedProfile(null)}>
          <div
                className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-[#d89075]/45 bg-[#080912] text-white"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={selectedProfile.images[selectedProfileImageIndex] || selectedProfile.images[0]}
              alt={selectedProfile.name}
              className="h-96 w-full object-cover"
            />
            <div className="space-y-4 p-6">
              {selectedProfile.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {selectedProfile.images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setSelectedProfileImageIndex(index)}
                      className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 ${
                        index === selectedProfileImageIndex ? "border-[#ff3f7f]" : "border-white/15"
                      }`}
                      aria-label={`Show photo ${index + 1}`}
                    >
                      <img src={image} alt={`${selectedProfile.name} photo ${index + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              <div>
                <h2 className="text-3xl font-semibold">{selectedProfile.name}, {selectedProfile.age}</h2>
                <p className="text-sm text-white/50">{selectedProfile.location}</p>
              </div>
              <PublicProfileDetails profile={selectedProfile} />
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    hideProfileFromCurrentFeed(selectedProfile.id);
                    setSelectedProfile(null);
                  }}
                  className="flex-1 rounded-2xl border border-[#d89075]/45 py-3 text-white/60"
                >
                  <X className="mx-auto h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const liked = await onLikeProfile(selectedProfile);
                    if (!liked) return;
                    hideProfileFromCurrentFeed(selectedProfile.id);
                    setSelectedProfile(null);
                  }}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-[#f01c66] to-[#c9064f] py-3 text-white"
                >
                  <Heart className="mx-auto h-6 w-6 fill-current" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
