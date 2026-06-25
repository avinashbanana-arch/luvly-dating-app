import { X, Star, Heart, Sparkles, Smile, Trophy, Sun } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";

interface ComplimentModalProps {
  isOpen: boolean;
  profileName: string;
  isPremium: boolean;
  onClose: () => void;
  onSendCompliment: (compliment: string) => void;
  onUpgradeToPremium: () => void;
}

export function ComplimentModal({
  isOpen,
  profileName,
  isPremium,
  onClose,
  onSendCompliment,
  onUpgradeToPremium,
}: ComplimentModalProps) {
  const [selectedCompliment, setSelectedCompliment] = useState("");

  const compliments = [
    { icon: Heart, text: "You have a beautiful smile", color: "bg-red-100 text-red-600" },
    { icon: Star, text: "Love your style!", color: "bg-yellow-100 text-yellow-600" },
    { icon: Sparkles, text: "Your profile is amazing", color: "bg-purple-100 text-purple-600" },
    { icon: Smile, text: "You seem really fun!", color: "bg-blue-100 text-blue-600" },
    { icon: Trophy, text: "Great taste in music/hobbies", color: "bg-green-100 text-green-600" },
    { icon: Sun, text: "You have positive vibes", color: "bg-orange-100 text-orange-600" },
  ];

  const handleSend = () => {
    if (selectedCompliment) {
      onSendCompliment(selectedCompliment);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-3xl w-full max-w-md overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl">Send a Compliment to {profileName}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {!isPremium ? (
                <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-3xl p-6 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <Star className="w-8 h-8 fill-current" />
                    <div>
                      <h3 className="text-lg">Premium Feature</h3>
                      <p className="text-sm text-yellow-100">
                        Stand out with personalized compliments
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onUpgradeToPremium}
                    className="w-full py-3 bg-white text-yellow-600 rounded-full hover:bg-yellow-50 transition-colors"
                  >
                    Unlock Compliments
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-gray-600 text-sm">
                    Make a great first impression! Select a compliment to send
                    with your like.
                  </p>
                  <div className="space-y-2">
                    {compliments.map((compliment) => (
                      <button
                        key={compliment.text}
                        onClick={() => setSelectedCompliment(compliment.text)}
                        className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                          selectedCompliment === compliment.text
                            ? "border-pink-500 bg-pink-50"
                            : "border-gray-200 hover:border-pink-300"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${compliment.color}`}>
                          <compliment.icon className="w-5 h-5" />
                        </div>
                        <span className="text-gray-800">{compliment.text}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={onClose}
                      className="flex-1 py-3 border-2 border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSend}
                      disabled={!selectedCompliment}
                      className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send Compliment
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
