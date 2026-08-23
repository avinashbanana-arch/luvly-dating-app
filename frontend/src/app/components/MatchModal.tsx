import { motion, AnimatePresence } from "motion/react";
import { Heart, MessageCircle, X } from "lucide-react";
import { Profile } from "./SwipeCard";
import { PublicProfileDetails } from "./PublicProfileDetails";

interface MatchModalProps {
  isOpen: boolean;
  profile: Profile | null;
  onClose: () => void;
  onSendMessage: () => void;
  onKeepSwiping?: () => void;
}

export function MatchModal({
  isOpen,
  profile,
  onClose,
  onSendMessage,
  onKeepSwiping,
}: MatchModalProps) {
  if (!profile) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative max-w-md w-full bg-gradient-to-b from-pink-500 to-red-500 rounded-3xl p-8 text-white text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-6"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full">
                <Heart className="w-12 h-12 fill-current" />
              </div>
            </motion.div>

            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl mb-2"
            >
              It's a Match!
            </motion.h2>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-white/90 mb-8"
            >
              You and {profile.name} have liked each other
            </motion.p>

            <div className="mb-6 max-h-56 overflow-y-auto rounded-2xl bg-black/15 p-4 text-left">
              <PublicProfileDetails profile={profile} showPhotos />
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex gap-4"
            >
              <button
                onClick={onKeepSwiping || onClose}
                className="flex-1 py-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                Maybe Later
              </button>
              <button
                onClick={onSendMessage}
                className="flex-1 py-3 rounded-full bg-white text-pink-500 hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                It's a Match 💞
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
