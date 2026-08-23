import { useState } from "react";
import { Heart, Lock, Star, Clock, TrendingUp, X, Instagram, Music, Users } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PublicProfileDetails } from "./PublicProfileDetails";
import { PhotoLightbox } from "./PhotoLightbox";
import { useProfileImagePlaceholder } from "../../lib/profileImage";

export interface LikedProfile {
  id: string;
  name: string;
  age: number;
  image: string;
  location: string;
  likedYouBack: boolean;
  timestamp: string;
  instagram?: string;
  spotify?: string;
  bio?: string;
  occupation?: string;
  education?: string;
  interests?: string[];
  images?: string[];
  prompts?: Array<{ question: string; answer: string }>;
  gender?: string;
  religion?: string;
  heightCm?: number | "";
  preferredLanguage?: string;
  ethnicity?: string;
  zodiacSign?: string;
  jobTitle?: string;
  video?: string;
  preference?: string;
  communities?: string[];
  isVerified?: boolean;
}

interface LikesViewProps {
  likedByYou: LikedProfile[];
  likedYou: LikedProfile[];
  matchedProfiles: LikedProfile[];
  matchesLoading: boolean;
  matchesError: string;
  isPremium: boolean;
  dailyLikesCount: number;
  dailyLikesLimit: number;
  nextFreeReveal: Date | null;
  onUpgradeToPremium: () => void;
  onProfileClick: (profile: LikedProfile) => void;
  onLikeBack: (profile: LikedProfile) => Promise<boolean>;
  onOpenMatchChat: (profile: LikedProfile) => Promise<boolean>;
}

function ProfileDetailModal({
  profile,
  onClose,
  onLikeBack,
  isPremium,
  dailyLikesCount,
  dailyLikesLimit,
  onUpgradeToPremium,
  section,
  onOpenMatchChat,
}: {
  profile: LikedProfile;
  onClose: () => void;
  onLikeBack: (p: LikedProfile) => Promise<boolean>;
  isPremium: boolean;
  dailyLikesCount: number;
  dailyLikesLimit: number;
  onUpgradeToPremium: () => void;
  section: "sent" | "received" | "matches";
  onOpenMatchChat: (profile: LikedProfile) => Promise<boolean>;
}) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isPhotoLightboxOpen, setIsPhotoLightboxOpen] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);
  const profileImages = profile.images?.length ? profile.images : [profile.image];
  const activeImage = profileImages[Math.min(activeImageIndex, profileImages.length - 1)];

  const handleLikeBack = async () => {
    const liked = await onLikeBack(profile);
    if (liked) onClose();
  };

  const handleOpenMatchChat = async () => {
    setOpeningChat(true);
    const opened = await onOpenMatchChat(profile);
    if (!opened) setOpeningChat(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/75 flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25 }}
        className="bg-[#080912] text-white border border-[#d89075]/45 w-full max-w-md rounded-t-3xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Profile Image */}
        <div className="relative h-80">
          <button type="button" onClick={() => setIsPhotoLightboxOpen(true)} className="h-full w-full" aria-label={`Expand ${profile.name}'s photos`}>
            <img src={activeImage} alt={profile.name} className="h-full w-full object-cover" onError={useProfileImagePlaceholder} />
          </button>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 bg-white/20 backdrop-blur rounded-full flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="absolute bottom-4 left-4 text-white">
            <h2 className="text-2xl font-semibold">{profile.name}, {profile.age}</h2>
            <p className="text-white/80 text-sm">{profile.location}</p>
          </div>
        </div>

        {/* Info */}
        <div className="p-6 space-y-4">
          {profileImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {profileImages.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => {
                    setActiveImageIndex(index);
                    setIsPhotoLightboxOpen(true);
                  }}
                  className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 ${
                    index === activeImageIndex ? "border-[#ff3f7f]" : "border-white/15"
                  }`}
                  aria-label={`Show photo ${index + 1}`}
                >
                  <img src={image} alt={`${profile.name} photo ${index + 1}`} className="h-full w-full object-cover" onError={useProfileImagePlaceholder} />
                </button>
              ))}
            </div>
          )}
          <p className="text-xs text-white/45">
            {section === "matches" ? "Matched" : section === "received" ? "This user liked you." : "You liked this user."} {profile.timestamp}
          </p>
          <PublicProfileDetails profile={profile} />

          {/* Social Links */}
          <div className="flex gap-3">
            {profile.instagram && (
              <a
                href={`https://instagram.com/${profile.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm"
              >
                <Instagram className="w-4 h-4" />
                @{profile.instagram}
              </a>
            )}
            {profile.spotify && (
              <a
                href={`https://open.spotify.com/user/${profile.spotify}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-full text-sm"
              >
                <Music className="w-4 h-4" />
                Spotify
              </a>
            )}
          </div>

          {/* Action */}
          {section === "matches" ? (
            <button
              type="button"
              onClick={handleOpenMatchChat}
              disabled={openingChat}
              className="w-full py-4 bg-gradient-to-r from-[#f01c66] to-[#c9064f] text-white rounded-2xl text-center disabled:opacity-70"
            >
              <div className="flex items-center justify-center gap-2">
                <Heart className="w-5 h-5 fill-current" />
                <span className="font-semibold">It's a Match! 🎉</span>
              </div>
              <p className="text-sm text-white/80 mt-1">You can now message each other</p>
            </button>
          ) : section === "received" ? (
            <button
              onClick={handleLikeBack}
              className="w-full py-4 bg-gradient-to-r from-[#f01c66] to-[#c9064f] text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-shadow"
            >
              <Heart className="w-5 h-5 fill-current" />
              Like Back & Match
            </button>
          ) : null}

          {section === "matches" && (
            <button
              onClick={onClose}
              className="w-full py-3 border border-[#d89075]/40 rounded-2xl text-white/60 hover:bg-white/10 transition-colors"
            >
              Maybe Later
            </button>
          )}
        </div>
        {isPhotoLightboxOpen && (
          <PhotoLightbox
            images={profileImages}
            name={profile.name}
            initialIndex={activeImageIndex}
            onClose={() => setIsPhotoLightboxOpen(false)}
            onIndexChange={setActiveImageIndex}
          />
        )}
      </motion.div>
    </motion.div>
  );
}

export function LikesView({
  likedByYou,
  likedYou,
  matchedProfiles,
  matchesLoading,
  matchesError,
  isPremium,
  dailyLikesCount,
  dailyLikesLimit,
  nextFreeReveal,
  onUpgradeToPremium,
  onProfileClick,
  onLikeBack,
  onOpenMatchChat,
}: LikesViewProps) {
  const [activeTab, setActiveTab] = useState<"sent" | "received" | "matches">("received");
  const [selectedProfile, setSelectedProfile] = useState<LikedProfile | null>(null);

  const getTimeUntilNextReveal = () => {
    if (!nextFreeReveal) return "";
    const now = new Date();
    const diff = nextFreeReveal.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes <= 0) return "Available now!";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const revealedCount = isPremium ? likedYou.length : Math.min(1, likedYou.length);
  const hiddenCount = likedYou.length - revealedCount;

  return (
    <div className="h-full flex flex-col bg-[#080912] text-white">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <h1 className="font-serif text-3xl mb-2 text-[#ffe1ae]">Likes</h1>
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="w-4 h-4 text-[#ff3f7f]" />
          <span className="text-white/60">
            Daily likes:{" "}
            <strong className={dailyLikesCount >= dailyLikesLimit ? "text-[#ff9caf]" : "text-[#ffd9aa]"}>
              {dailyLikesCount}/{dailyLikesLimit}
            </strong>
          </span>
        </div>
        {dailyLikesCount >= dailyLikesLimit && (
          <p className="text-xs text-[#ff9caf] mt-1">Daily limit reached. Try again tomorrow!</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab("received")}
          className={`flex-1 py-4 relative ${activeTab === "received" ? "text-[#ffd9aa]" : "text-white/45"}`}
        >
          <div className="flex items-center justify-center gap-2">
            <Heart className="w-5 h-5" />
            <span>Received ({likedYou.length})</span>
          </div>
          {activeTab === "received" && (
            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff3f7f]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("sent")}
          className={`flex-1 py-4 relative ${activeTab === "sent" ? "text-[#ffd9aa]" : "text-white/45"}`}
        >
          <div className="flex items-center justify-center gap-2">
            <TrendingUp className="w-5 h-5" />
            <span>Sent ({likedByYou.length})</span>
          </div>
          {activeTab === "sent" && (
            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff3f7f]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("matches")}
          className={`flex-1 py-4 relative ${activeTab === "matches" ? "text-[#ffd9aa]" : "text-white/45"}`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Users className="w-5 h-5" />
            <span>Matches ({matchedProfiles.length})</span>
          </div>
          {activeTab === "matches" && (
            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff3f7f]" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === "matches" ? (
          <div>
            {matchesLoading ? (
              <div className="text-center py-12 text-white/45">Loading matches…</div>
            ) : matchesError ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-[#ff3f7f] mx-auto mb-4" />
                <p className="text-[#ff9caf]">{matchesError}</p>
              </div>
            ) : matchedProfiles.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-[#ff3f7f] mx-auto mb-4" />
                <p className="text-[#ffe1ae]">No matches yet</p>
                <p className="text-sm text-white/45 mt-1">Like someone who likes you back to make a match.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {matchedProfiles.map((profile) => (
                  <motion.button
                    key={profile.id}
                    type="button"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative aspect-[3/4] rounded-2xl overflow-hidden text-left group"
                    onClick={() => {
                      onProfileClick(profile);
                      setSelectedProfile(profile);
                    }}
                  >
                    <img src={profile.image} alt={profile.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                      <h3 className="font-semibold">{profile.name}, {profile.age}</h3>
                      <p className="text-xs text-white/80">{profile.location}</p>
                      <div className="mt-2 inline-flex items-center gap-1 bg-pink-500 px-2 py-1 rounded-full text-xs">
                        <Heart className="w-3 h-3 fill-current" />
                        <span>Matched</span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === "received" ? (
          <div className="space-y-4">
            {!isPremium && likedYou.length > 0 && (
              <div className="bg-gradient-to-r from-[#f01c66] to-[#c9064f] rounded-3xl p-6 text-white mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <Star className="w-8 h-8" />
                  <div>
                    <h3 className="text-lg">Upgrade to Luvly Premium</h3>
                    <p className="text-sm text-pink-100">See all {likedYou.length} likes instantly</p>
                  </div>
                </div>
                <button
                  onClick={onUpgradeToPremium}
                  className="w-full py-3 bg-white text-[#c9064f] rounded-2xl hover:bg-[#fff4f7] transition-colors"
                >
                  Unlock Now
                </button>
              </div>
            )}

            {!isPremium && likedYou.length > 0 && (
              <div className="bg-[#ffd9aa]/10 border border-[#ffd9aa]/25 rounded-2xl p-4 mb-4 flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#ffd9aa]" />
                <div className="flex-1">
                  <p className="text-sm text-white/70">
                    Next free reveal in: <strong>{getTimeUntilNextReveal()}</strong>
                  </p>
                </div>
              </div>
            )}

            {likedYou.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 text-[#ff3f7f] mx-auto mb-4" />
                <p className="text-[#ffe1ae]">No likes yet</p>
                <p className="text-sm text-white/45 mt-1">Keep swiping to get more matches!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {/* Revealed Likes — clickable to open detail modal */}
                {likedYou.slice(0, revealedCount).map((profile) => (
                  <motion.div
                    key={profile.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer group"
                    onClick={() => setSelectedProfile(profile)}
                  >
                    <img
                      src={profile.image}
                      alt={profile.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                      <h3 className="font-semibold">{profile.name}, {profile.age}</h3>
                      <p className="text-xs text-white/80">{profile.location}</p>
                      <div className="mt-2 inline-flex items-center gap-1 bg-white/20 backdrop-blur px-2 py-1 rounded-full text-xs">
                        <Heart className="w-3 h-3" />
                        <span>This user liked you.</span>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Blurred/Locked Likes */}
                {!isPremium &&
                  likedYou.slice(revealedCount).map((profile) => (
                    <div
                      key={profile.id}
                      className="relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer"
                      onClick={onUpgradeToPremium}
                    >
                      <img src={profile.image} alt="Hidden" className="w-full h-full object-cover blur-xl" />
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                        <Lock className="w-8 h-8 text-white mb-2" />
                        <p className="text-white text-sm">Upgrade</p>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {!isPremium && hiddenCount > 0 && (
              <div className="text-center mt-6">
                <p className="text-white/65 mb-3">
                  <strong>{hiddenCount}</strong> more {hiddenCount === 1 ? "person" : "people"} liked you
                </p>
                <button
                  onClick={onUpgradeToPremium}
                  className="px-6 py-3 bg-gradient-to-r from-[#f01c66] to-[#c9064f] text-white rounded-2xl hover:shadow-lg transition-shadow"
                >
                  Unlock All Likes
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            {likedByYou.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-[#ff3f7f] mx-auto mb-4" />
                <p className="text-[#ffe1ae]">No likes sent yet</p>
                <p className="text-sm text-white/45 mt-1">Start swiping to like profiles!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {likedByYou.map((profile) => (
                  <div
                    key={profile.id}
                    className="relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer group"
                    onClick={() => {
                      onProfileClick(profile);
                      setSelectedProfile(profile);
                    }}
                  >
                    <img
                      src={profile.image}
                      alt={profile.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                      <h3 className="font-semibold">{profile.name}, {profile.age}</h3>
                      <p className="text-xs text-white/80">{profile.location}</p>
                      <div className="mt-2 inline-flex items-center gap-1 bg-gray-500/80 px-2 py-1 rounded-full text-xs">
                        <Heart className="w-3 h-3" />
                        <span>You liked this user.</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Profile Detail Modal */}
      <AnimatePresence>
        {selectedProfile && (
          <ProfileDetailModal
            profile={selectedProfile}
            onClose={() => setSelectedProfile(null)}
            onLikeBack={async (p) => {
              const liked = await onLikeBack(p);
              if (liked) setSelectedProfile(null);
              return liked;
            }}
            isPremium={isPremium}
            dailyLikesCount={dailyLikesCount}
            dailyLikesLimit={dailyLikesLimit}
            onUpgradeToPremium={() => {
              setSelectedProfile(null);
              onUpgradeToPremium();
            }}
            section={activeTab}
            onOpenMatchChat={onOpenMatchChat}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
