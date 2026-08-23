import { useEffect, useRef, useState } from "react";
import { X, Heart, MapPin, Briefcase, Info, Flag } from "lucide-react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { PublicProfileDetails } from "./PublicProfileDetails";
import { PhotoLightbox } from "./PhotoLightbox";
import { useProfileImagePlaceholder } from "../../lib/profileImage";

export interface Profile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  age: number;
  bio: string;
  location: string;
  occupation: string;
  jobTitle?: string;
  education?: string;
  religion?: string;
  heightCm?: number | "";
  preferredLanguage?: string;
  ethnicity?: string;
  gender?: string;
  preference?: string;
  zodiacSign?: string;
  video?: string;
  prompts?: Array<{ question: string; answer: string }>;
  communities?: string[];
  isVerified?: boolean;
  images: string[];
  interests: string[];
  country?: string;
}

interface SwipeCardProps {
  profile: Profile;
  onSwipe: (direction: "left" | "right") => boolean | void | Promise<boolean | void>;
  onReport?: () => void;
  style?: React.CSSProperties;
  actionSwipe?: { id: number; direction: "left" | "right" } | null;
}

export function SwipeCard({ profile, onSwipe, onReport, style, actionSwipe }: SwipeCardProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isPhotoLightboxOpen, setIsPhotoLightboxOpen] = useState(false);
  const x = useMotionValue(0);
  const baseScale = typeof style?.scale === "number" ? style.scale : 1;
  const scale = useMotionValue(baseScale);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const likeOpacity = useTransform(x, [0, 72, 155], [0, 0.65, 1]);
  const nopeOpacity = useTransform(x, [-155, -72, 0], [1, 0.65, 0]);
  const profileImages = profile.images.length ? profile.images : [];
  const activeImage = profileImages[Math.min(activeImageIndex, profileImages.length - 1)] || "";
  const isSwipingRef = useRef(false);
  const { scale: _styleScale, ...cardStyle } = style || {};

  useEffect(() => {
    if (!isSwipingRef.current) scale.set(baseScale);
  }, [baseScale, scale]);

  useEffect(() => {
    if (!actionSwipe || isSwipingRef.current) return;
    void runSwipeAnimation(actionSwipe.direction);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionSwipe?.id]);

  const runSwipeAnimation = async (direction: "left" | "right") => {
    if (isSwipingRef.current) return;
    isSwipingRef.current = true;
    const exitX = direction === "right" ? 540 : -540;

    await Promise.all([
      animate(x, exitX, { duration: 0.58, ease: [0.22, 1, 0.36, 1] }),
      animate(scale, 1.08, { duration: 0.34, ease: [0.22, 1, 0.36, 1] }),
    ]);

    const swipeAccepted = await onSwipe(direction);
    if (swipeAccepted === false) {
      await Promise.all([
        animate(x, 0, { type: "spring", stiffness: 190, damping: 22 }),
        animate(scale, baseScale, { type: "spring", stiffness: 190, damping: 22 }),
      ]);
      isSwipingRef.current = false;
    }
  };

  const handleDragEnd = (_: any, info: any) => {
    if (Math.abs(info.offset.x) > 100) {
      void runSwipeAnimation(info.offset.x > 0 ? "right" : "left");
    }
  };

  return (
    <motion.div
      style={{
        x,
        rotate,
        opacity,
        scale,
        ...cardStyle,
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.28}
      whileDrag={{ scale: baseScale + 0.03 }}
      onDragEnd={handleDragEnd}
      transition={{ type: "spring", stiffness: 90, damping: 20, mass: 1.05 }}
      className="absolute w-full h-full cursor-grab active:cursor-grabbing"
    >
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-[#d89075]/45 bg-[#090912] shadow-[0_28px_70px_rgba(0,0,0,0.55)]">
        {/* Main Image */}
        <div className="relative h-[38%] min-h-[150px] shrink-0">
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              setIsPhotoLightboxOpen(true);
            }}
            className="h-full w-full"
            aria-label={`Expand ${profile.name}'s photos`}
          >
            <img src={activeImage} alt={profile.name} className="h-full w-full object-cover" onError={useProfileImagePlaceholder} />
          </button>
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#080912] via-black/20 to-transparent" />
          {profileImages.length > 1 && (
            <div className="absolute left-4 right-4 top-4 flex gap-1.5">
              {profileImages.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    setActiveImageIndex(index);
                  }}
                  className={`h-1.5 flex-1 rounded-full ${
                    index === activeImageIndex ? "bg-white" : "bg-white/35"
                  }`}
                  aria-label={`Show photo ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="shrink-0 p-5 pb-3 text-white">
          <div className="mb-3">
            <h2 className="text-3xl mb-1">
              {profile.name}, {profile.age}
            </h2>
            <div className="flex items-center gap-4 text-sm opacity-90">
              <div className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                <span>{profile.occupation}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{profile.location}</span>
              </div>
            </div>
          </div>

          <p className="line-clamp-2 text-sm opacity-90">{profile.bio}</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-[#d89075]/30 bg-[#090912]/96 p-5 pt-4 text-white backdrop-blur">
          <h3 className="mb-2 text-lg font-semibold text-[#ffe1ae]">About {profile.name}</h3>
          <PublicProfileDetails profile={profile} className="pb-6" />
        </div>

        {/* Swipe Indicators */}
        <motion.div
          style={{ opacity: likeOpacity, scale: useTransform(x, [0, 160], [0.9, 1.08]) }}
          className="absolute top-8 right-8 rounded-2xl border-4 border-[#ffd9aa] bg-[#090912]/70 px-6 py-3 text-2xl font-bold text-[#ffd9aa] rotate-12 shadow-[0_18px_42px_rgba(255,217,170,0.25)]"
        >
          LIKE
        </motion.div>
        <motion.div
          style={{ opacity: nopeOpacity, scale: useTransform(x, [-160, 0], [1.08, 0.9]) }}
          className="absolute top-8 left-8 rounded-2xl border-4 border-[#ff6f91] bg-[#090912]/70 px-6 py-3 text-2xl font-bold text-[#ff9caf] -rotate-12 shadow-[0_18px_42px_rgba(255,111,145,0.25)]"
        >
          NOPE
        </motion.div>

        {/* Report Button */}
        {onReport && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onReport}
            className="absolute top-8 right-8 rounded-2xl border-4 border-[#ff6f91] px-6 py-3 text-2xl text-[#ff9caf] rotate-12"
          >
            <Flag className="w-8 h-8" />
          </motion.button>
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
  );
}

interface ActionButtonsProps {
  onPass: () => void;
  onLike: () => void;
  disabled?: boolean;
}

export function ActionButtons({ onPass, onLike, disabled = false }: ActionButtonsProps) {
  return (
    <div className="flex justify-center gap-6 mt-6 pb-4">
      <motion.button
        whileHover={{ scale: disabled ? 1 : 1.06 }}
        whileTap={{ scale: disabled ? 1 : 0.94 }}
        onClick={onPass}
        disabled={disabled}
        className="w-16 h-16 rounded-full border border-[#d89075]/45 bg-[#090912] shadow-[0_12px_28px_rgba(0,0,0,0.35)] flex items-center justify-center text-[#ff9caf] hover:bg-[#ff3f7f]/10 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        <X className="w-8 h-8" strokeWidth={2.5} />
      </motion.button>
      <motion.button
        whileHover={{ scale: disabled ? 1 : 1.06 }}
        whileTap={{ scale: disabled ? 1 : 0.94 }}
        onClick={onLike}
        disabled={disabled}
        className="w-16 h-16 rounded-full bg-gradient-to-r from-[#f01c66] to-[#c9064f] shadow-[0_14px_30px_rgba(232,18,87,0.42)] flex items-center justify-center text-white hover:shadow-xl transition-shadow disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Heart className="w-8 h-8 fill-current" />
      </motion.button>
    </div>
  );
}
