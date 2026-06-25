import { useState } from "react";
import { X, User, Briefcase, MapPin, GraduationCap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PhotoVideoUpload } from "./PhotoVideoUpload";

interface UserProfile {
  name: string;
  age: number;
  image: string;
  images: string[];
  video?: string;
  bio: string;
  location: string;
  occupation: string;
  education: string;
  ethnicity: string;
  zodiacSign: string;
  interests: string[];
  prompts: Array<{ question: string; answer: string }>;
}

interface EditProfileModalProps {
  isOpen: boolean;
  profile: UserProfile;
  onClose: () => void;
  onSave: (profile: UserProfile) => void;
}

export function EditProfileModal({
  isOpen,
  profile,
  onClose,
  onSave,
}: EditProfileModalProps) {
  const [editedProfile, setEditedProfile] = useState(profile);
  const [selectedInterests, setSelectedInterests] = useState(profile.interests);
  const [prompts, setPrompts] = useState(profile.prompts || []);
  const [images, setImages] = useState(profile.images || [profile.image]);
  const [video, setVideo] = useState(profile.video || "");
  const [zodiacSign, setZodiacSign] = useState(profile.zodiacSign || "");

  const availablePrompts = [
    "My perfect first date",
    "I'm weirdly competitive about",
    "A life goal of mine",
    "I'll fall for you if",
    "My ideal Sunday",
    "The key to my heart",
    "My simple pleasures",
    "I geek out on",
    "I'll know I've found the one when",
    "We'll get along if",
  ];

  const ethnicityOptions = [
    "Asian",
    "Black/African",
    "Hispanic/Latino",
    "White/Caucasian",
    "Middle Eastern",
    "Native American",
    "Pacific Islander",
    "Mixed/Multiracial",
    "Other",
    "Prefer not to say",
  ];

  const zodiacSigns = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", 
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];

  const availableInterests = [
    "Travel",
    "Music",
    "Movies",
    "Sports",
    "Gym",
    "Books",
    "Science",
    "Dance",
    "Cooking",
    "Photography",
    "Art",
    "Gaming",
    "Coffee",
    "Fashion",
    "Technology",
  ];

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleSave = () => {
    onSave({ 
      ...editedProfile, 
      interests: selectedInterests, 
      prompts, 
      images,
      image: images[0] || editedProfile.image,
      video,
      zodiacSign
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl">Edit Profile</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Photos and Video Upload */}
              <PhotoVideoUpload
                images={images}
                video={video}
                onImagesChange={setImages}
                onVideoChange={setVideo}
                minPhotos={4}
                maxPhotos={6}
              />

              {/* Name */}
              <div>
                <label className="text-sm text-gray-600 mb-2 block flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Name
                </label>
                <input
                  type="text"
                  value={editedProfile.name}
                  onChange={(e) =>
                    setEditedProfile({ ...editedProfile, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* Age */}
              <div>
                <label className="text-sm text-gray-600 mb-2 block">
                  Age: {editedProfile.age}
                </label>
                <input
                  type="range"
                  min="18"
                  max="80"
                  value={editedProfile.age}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      age: parseInt(e.target.value),
                    })
                  }
                  className="w-full accent-pink-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>18</span>
                  <span>80</span>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Bio</label>
                <textarea
                  value={editedProfile.bio}
                  onChange={(e) =>
                    setEditedProfile({ ...editedProfile, bio: e.target.value })
                  }
                  rows={3}
                  maxLength={150}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-pink-500 resize-none"
                  placeholder="Tell us about yourself..."
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {editedProfile.bio.length}/150
                </p>
              </div>

              {/* Location */}
              <div>
                <label className="text-sm text-gray-600 mb-2 block flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </label>
                <input
                  type="text"
                  value={editedProfile.location}
                  onChange={(e) =>
                    setEditedProfile({ ...editedProfile, location: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500"
                  placeholder="City, State"
                />
              </div>

              {/* Occupation */}
              <div>
                <label className="text-sm text-gray-600 mb-2 block flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Occupation
                </label>
                <input
                  type="text"
                  value={editedProfile.occupation}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      occupation: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500"
                  placeholder="Your job title"
                />
              </div>

              {/* Education */}
              <div>
                <label className="text-sm text-gray-600 mb-2 block flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Education
                </label>
                <input
                  type="text"
                  value={editedProfile.education}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      education: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500"
                  placeholder="School or university"
                />
              </div>

              {/* Ethnicity */}
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Ethnicity</label>
                <select
                  value={editedProfile.ethnicity}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      ethnicity: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500"
                >
                  {ethnicityOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {/* Zodiac Sign */}
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Zodiac Sign</label>
                <select
                  value={zodiacSign}
                  onChange={(e) => setZodiacSign(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500"
                >
                  <option value="">Select Zodiac Sign</option>
                  {zodiacSigns.map((sign) => (
                    <option key={sign} value={sign}>
                      {sign}
                    </option>
                  ))}
                </select>
              </div>

              {/* Interests */}
              <div>
                <label className="text-sm text-gray-600 mb-3 block">
                  Interests ({selectedInterests.length} selected)
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableInterests.map((interest) => (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`px-4 py-2 rounded-full border-2 transition-all ${
                        selectedInterests.includes(interest)
                          ? "border-pink-500 bg-pink-50 text-pink-700"
                          : "border-gray-200 hover:border-pink-300"
                      }`}
                    >
                      {interest}
                    </button>
                  ))  }
                </div>
              </div>

              {/* Prompts */}
              <div>
                <label className="text-sm text-gray-600 mb-3 block">
                  Prompts (Max 3)
                </label>
                <div className="flex flex-wrap gap-2">
                  {availablePrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => {
                        const existingPrompt = prompts.find((p) => p.question === prompt);
                        if (existingPrompt) {
                          setPrompts(prompts.filter((p) => p.question !== prompt));
                        } else if (prompts.length < 3) {
                          setPrompts([...prompts, { question: prompt, answer: "" }]);
                        }
                      }}
                      className={`px-4 py-2 rounded-full border-2 transition-all ${
                        prompts.some((p) => p.question === prompt)
                          ? "border-pink-500 bg-pink-50 text-pink-700"
                          : "border-gray-200 hover:border-pink-300"
                      }`}
                      disabled={prompts.length >= 3 && !prompts.some((p) => p.question === prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
                {prompts.map((prompt) => (
                  <div key={prompt.question} className="mt-3">
                    <label className="text-xs text-gray-600 mb-1 block">
                      {prompt.question}
                    </label>
                    <input
                      type="text"
                      value={prompt.answer}
                      onChange={(e) => {
                        const updatedPrompts = prompts.map((p) =>
                          p.question === prompt.question ? { ...p, answer: e.target.value } : p
                        );
                        setPrompts(updatedPrompts);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500"
                      placeholder="Your answer..."
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 border-2 border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={images.length < 4}
                className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
