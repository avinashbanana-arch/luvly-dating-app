import { useState } from "react";
import { Heart, Lock, Star, Clock, TrendingUp, X, Instagram, Music } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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
}

interface LikesViewProps {
  likedByYou: LikedProfile[];
  likedYou: LikedProfile[];
  isPremium: boolean;
  dailyLikesCount: number;
  dailyLikesLimit: number;
  nextFreeReveal: Date | null;
  onUpgradeToPremium: () => void;
  onProfileClick: (profile: LikedProfile) => void;
  onLikeBack: (profile: LikedProfile) => void;
}

function ProfileDetailModal({
  profile,
  onClose,
  onLikeBack,
  isPremium,
  dailyLikesCount,
  dailyLikesLimit,
  onUpgradeToPremium,
}: {
  profile: LikedProfile;
  onClose: () => void;
  onLikeBack: (p: LikedProfile) => void;
  isPremium: boolean;
  dailyLikesCount: number;
  dailyLikesLimit: number;
  onUpgradeToPremium: () => void;
}) {
  const [matched, setMatched] = useState(profile.likedYouBack);

  const handleLikeBack = () => {
    if (!isPremium && dailyLikesCount >= dailyLikesLimit) {
      onUpgradeToPremium();
      return;
    }
    setMatched(true);
    onLikeBack(profile);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25 }}
        className="bg-white w-full max-w-md rounded-t-3xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Profile Image */}
        <div className="relative h-80">
          <img
            src={profile.image}
            alt={profile.name}
            className="w-full h-full object-cover"
          />
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
          <p className="text-xs text-gray-400">Liked you {profile.timestamp}</p>

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
          {matched ? (
            <div className="w-full py-4 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-2xl text-center">
              <div className="flex items-center justify-center gap-2">
                <Heart className="w-5 h-5 fill-current" />
                <span className="font-semibold">It's a Match! 🎉</span>
              </div>
              <p className="text-sm text-white/80 mt-1">You can now message each other</p>
            </div>
          ) : (
            <button
              onClick={handleLikeBack}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-shadow"
            >
              <Heart className="w-5 h-5 fill-current" />
              Like Back & Match
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-3 border border-gray-200 rounded-2xl text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function LikesView({
  likedByYou,
  likedYou,
  isPremium,
  dailyLikesCount,
  dailyLikesLimit,
  nextFreeReveal,
  onUpgradeToPremium,
  onProfileClick,
  onLikeBack,
}: LikesViewProps) {
  const [activeTab, setActiveTab] = useState<"sent" | "received">("received");
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
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b">
        <h1 className="text-2xl mb-2">Likes</h1>
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="w-4 h-4 text-pink-500" />
          <span className="text-gray-600">
            Daily likes:{" "}
            <strong className={dailyLikesCount >= dailyLikesLimit ? "text-red-500" : "text-pink-500"}>
              {dailyLikesCount}/{dailyLikesLimit}
            </strong>
          </span>
        </div>
        {dailyLikesCount >= dailyLikesLimit && (
          <p className="text-xs text-red-500 mt-1">Daily limit reached. Try again tomorrow!</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("received")}
          className={`flex-1 py-4 relative ${activeTab === "received" ? "text-pink-500" : "text-gray-400"}`}
        >
          <div className="flex items-center justify-center gap-2">
            <Heart className="w-5 h-5" />
            <span>Received ({likedYou.length})</span>
          </div>
          {activeTab === "received" && (
            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("sent")}
          className={`flex-1 py-4 relative ${activeTab === "sent" ? "text-pink-500" : "text-gray-400"}`}
        >
          <div className="flex items-center justify-center gap-2">
            <TrendingUp className="w-5 h-5" />
            <span>Sent ({likedByYou.length})</span>
          </div>
          {activeTab === "sent" && (
            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === "received" ? (
          <div className="space-y-4">
            {!isPremium && likedYou.length > 0 && (
              <div className="bg-gradient-to-r from-pink-500 to-red-500 rounded-3xl p-6 text-white mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <Star className="w-8 h-8" />
                  <div>
                    <h3 className="text-lg">Upgrade to Luvly Premium</h3>
                    <p className="text-sm text-pink-100">See all {likedYou.length} likes instantly</p>
                  </div>
                </div>
                <button
                  onClick={onUpgradeToPremium}
                  className="w-full py-3 bg-white text-pink-500 rounded-full hover:bg-pink-50 transition-colors"
                >
                  Unlock Now
                </button>
              </div>
            )}

            {!isPremium && likedYou.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-500" />
                <div className="flex-1">
                  <p className="text-sm text-blue-900">
                    Next free reveal in: <strong>{getTimeUntilNextReveal()}</strong>
                  </p>
                </div>
              </div>
            )}

            {likedYou.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No likes yet</p>
                <p className="text-sm text-gray-400 mt-1">Keep swiping to get more matches!</p>
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
                      {profile.likedYouBack ? (
                        <div className="mt-2 inline-flex items-center gap-1 bg-pink-500 px-2 py-1 rounded-full text-xs">
                          <Heart className="w-3 h-3 fill-current" />
                          <span>Matched!</span>
                        </div>
                      ) : (
                        <div className="mt-2 inline-flex items-center gap-1 bg-white/20 backdrop-blur px-2 py-1 rounded-full text-xs">
                          <Heart className="w-3 h-3" />
                          <span>Tap to match</span>
                        </div>
                      )}
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
                <p className="text-gray-600 mb-3">
                  <strong>{hiddenCount}</strong> more {hiddenCount === 1 ? "person" : "people"} liked you
                </p>
                <button
                  onClick={onUpgradeToPremium}
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full hover:shadow-lg transition-shadow"
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
                <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No likes sent yet</p>
                <p className="text-sm text-gray-400 mt-1">Start swiping to like profiles!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {likedByYou.map((profile) => (
                  <div
                    key={profile.id}
                    className="relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer group"
                    onClick={() => onProfileClick(profile)}
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
                      {profile.likedYouBack ? (
                        <div className="mt-2 inline-flex items-center gap-1 bg-green-500 px-2 py-1 rounded-full text-xs">
                          <Heart className="w-3 h-3 fill-current" />
                          <span>Liked You Back!</span>
                        </div>
                      ) : (
                        <div className="mt-2 inline-flex items-center gap-1 bg-gray-500/80 px-2 py-1 rounded-full text-xs">
                          <Clock className="w-3 h-3" />
                          <span>Pending</span>
                        </div>
                      )}
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
            onLikeBack={(p) => {
              onLikeBack(p);
              setSelectedProfile(null);
            }}
            isPremium={isPremium}
            dailyLikesCount={dailyLikesCount}
            dailyLikesLimit={dailyLikesLimit}
            onUpgradeToPremium={() => {
              setSelectedProfile(null);
              onUpgradeToPremium();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
