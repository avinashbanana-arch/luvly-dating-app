import { useState } from "react";
import { X, Heart, MapPin, Briefcase, Info, Flag } from "lucide-react";
import { motion, useMotionValue, useTransform } from "motion/react";

export interface Profile {
  id: string;
  name: string;
  age: number;
  bio: string;
  location: string;
  occupation: string;
  images: string[];
  interests: string[];
  country?: string;
}

interface SwipeCardProps {
  profile: Profile;
  onSwipe: (direction: "left" | "right") => void;
  onReport?: () => void;
  style?: React.CSSProperties;
}

export function SwipeCard({ profile, onSwipe, onReport, style }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (_: any, info: any) => {
    if (Math.abs(info.offset.x) > 100) {
      onSwipe(info.offset.x > 0 ? "right" : "left");
    }
  };

  return (
    <motion.div
      style={{
        x,
        rotate,
        opacity,
        ...style,
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className="absolute w-full h-full cursor-grab active:cursor-grabbing"
    >
      <div className="relative w-full h-full bg-white rounded-3xl overflow-hidden shadow-2xl">
        {/* Main Image */}
        <div className="h-[65%] relative">
          <img
            src={profile.images[0]}
            alt={profile.name}
            className="w-full h-full object-cover"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        {/* Profile Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
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

          <p className="text-sm mb-3 line-clamp-2 opacity-90">{profile.bio}</p>

          <div className="flex flex-wrap gap-2">
            {profile.interests.slice(0, 4).map((interest) => (
              <span
                key={interest}
                className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>

        {/* Swipe Indicators */}
        <motion.div
          style={{ opacity: useTransform(x, [0, 100], [0, 1]) }}
          className="absolute top-8 right-8 border-4 border-green-500 text-green-500 px-6 py-3 rounded-2xl rotate-12 text-2xl"
        >
          LIKE
        </motion.div>
        <motion.div
          style={{ opacity: useTransform(x, [-100, 0], [1, 0]) }}
          className="absolute top-8 left-8 border-4 border-red-500 text-red-500 px-6 py-3 rounded-2xl -rotate-12 text-2xl"
        >
          NOPE
        </motion.div>

        {/* Report Button */}
        {onReport && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onReport}
            className="absolute top-8 right-8 border-4 border-red-500 text-red-500 px-6 py-3 rounded-2xl rotate-12 text-2xl"
          >
            <Flag className="w-8 h-8" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

interface ActionButtonsProps {
  onPass: () => void;
  onLike: () => void;
}

export function ActionButtons({ onPass, onLike }: ActionButtonsProps) {
  return (
    <div className="flex justify-center gap-6 mt-6">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onPass}
        className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
      >
        <X className="w-8 h-8" strokeWidth={2.5} />
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onLike}
        className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-red-500 shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-shadow"
      >
        <Heart className="w-8 h-8 fill-current" />
      </motion.button>
    </div>
  );
}
