import { useState } from "react";
import { Settings, Edit, MapPin, Briefcase, GraduationCap, Heart, MessageSquareQuote, UserRound, Globe2, Ruler } from "lucide-react";
import { getCountryName } from "../../lib/countries";
import { PhotoLightbox } from "./PhotoLightbox";
import { useProfileImagePlaceholder } from "../../lib/profileImage";

interface UserProfile {
  name: string;
  age: number;
  image: string;
  images?: string[];
  video?: string;
  bio: string;
  location: string;
  country?: string;
  gender?: string;
  religion?: string;
  heightCm?: number | "";
  preferredLanguage?: string;
  occupation: string;
  jobTitle?: string;
  education: string;
  ethnicity?: string;
  zodiacSign?: string;
  interests: string[];
  prompts?: Array<{ question: string; answer: string }>;
  preference?: string;
  communities?: string[];
  isVerified?: boolean;
}

interface ProfileViewProps {
  profile: UserProfile;
  onSettings: () => void;
  onEditProfile: () => void;
}

export function ProfileView({ profile, onSettings, onEditProfile }: ProfileViewProps) {
  const profileImages = profile.images?.length ? profile.images : [profile.image].filter(Boolean);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isPhotoLightboxOpen, setIsPhotoLightboxOpen] = useState(false);
  const activeImage = profileImages[Math.min(activeImageIndex, profileImages.length - 1)];
  const gender = profile.gender
    ?.toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
  const country = profile.country ? getCountryName(profile.country) : "";
  const lookingFor = profile.preference
    ?.replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <div className="h-full overflow-y-auto bg-[#080912] text-white">
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <h1 className="font-serif text-3xl text-[#ffe1ae]">Profile</h1>
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors" onClick={onSettings}>
          <Settings className="w-6 h-6 text-[#ffd9aa]" />
        </button>
      </div>

      {/* Profile Image */}
      <div className="relative">
        {activeImage ? (
          <button
            type="button"
            className="block w-full"
            onClick={() => setIsPhotoLightboxOpen(true)}
            aria-label={`Expand ${profile.name}'s photos`}
          >
          <img
            src={activeImage}
            alt={profile.name}
            className="w-full h-96 object-cover"
            onError={useProfileImagePlaceholder}
          />
          </button>
        ) : (
          <div className="flex h-96 w-full items-center justify-center bg-white/5 text-white/50">
            No photo
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#080912] to-transparent" />
        <button className="absolute bottom-4 right-4 w-12 h-12 bg-[#090912] border border-[#d89075]/50 rounded-full shadow-lg flex items-center justify-center hover:bg-[#ff3f7f]/10 transition-colors" onClick={onEditProfile}>
          <Edit className="w-5 h-5 text-[#ffd9aa]" />
        </button>
      </div>

      {/* Profile Info */}
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-3xl mb-2">
            {profile.name}, {profile.age}
          </h2>
          <p className="text-white/65">{profile.bio}</p>
        </div>

        {!!profile.prompts?.some((prompt) => prompt.question && prompt.answer) && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <MessageSquareQuote className="h-5 w-5 text-[#ffd9aa]" />
              <h3 className="text-lg text-[#ffe1ae]">Conversation starters</h3>
            </div>
            <div className="space-y-3">
              {profile.prompts.filter((prompt) => prompt.question && prompt.answer).map((prompt) => (
                <div key={prompt.question} className="rounded-2xl border border-[#d89075]/30 bg-white/5 p-4">
                  <p className="text-sm text-[#d89075]">{prompt.question}</p>
                  <p className="mt-1 text-white">{prompt.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Details */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[#ff3f7f]/12 border border-[#ff3f7f]/25 rounded-full flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-[#ff7aa6]" />
            </div>
            <div>
              <p className="text-sm text-[#d89075]">Location</p>
              <p className="text-white">{profile.location}</p>
            </div>
          </div>

          {country && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#ffd9aa]/10 border border-[#ffd9aa]/25 rounded-full flex items-center justify-center flex-shrink-0">
                <Globe2 className="w-5 h-5 text-[#ffd9aa]" />
              </div>
              <div>
                <p className="text-sm text-[#d89075]">Country</p>
                <p className="text-white">{country}</p>
              </div>
            </div>
          )}

          {gender && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#ff7aa6]/10 border border-[#ff7aa6]/25 rounded-full flex items-center justify-center flex-shrink-0">
                <UserRound className="w-5 h-5 text-[#ff9caf]" />
              </div>
              <div>
                <p className="text-sm text-[#d89075]">Gender</p>
                <p className="text-white">{gender}</p>
              </div>
            </div>
          )}

          {profile.ethnicity && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#ff7aa6]/10 border border-[#ff7aa6]/25 rounded-full flex items-center justify-center flex-shrink-0">
                <UserRound className="w-5 h-5 text-[#ff9caf]" />
              </div>
              <div>
                <p className="text-sm text-[#d89075]">Ethnicity</p>
                <p className="text-white">{profile.ethnicity}</p>
              </div>
            </div>
          )}

          {profile.occupation && <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[#ffd9aa]/10 border border-[#ffd9aa]/25 rounded-full flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-5 h-5 text-[#ffd9aa]" />
            </div>
            <div>
              <p className="text-sm text-[#d89075]">Occupation</p>
              <p className="text-white">{profile.occupation}</p>
            </div>
          </div>}

          {profile.education && <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[#ff7aa6]/10 border border-[#ff7aa6]/25 rounded-full flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-5 h-5 text-[#ff9caf]" />
            </div>
            <div>
              <p className="text-sm text-[#d89075]">Education</p>
              <p className="text-white">{profile.education}</p>
            </div>
          </div>}

          {profile.zodiacSign && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#ffd9aa]/10 border border-[#ffd9aa]/25 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl">✨</span>
              </div>
              <div>
                <p className="text-sm text-[#d89075]">Zodiac Sign</p>
                <p className="text-white">{profile.zodiacSign}</p>
              </div>
            </div>
          )}

          {profile.religion && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#ff3f7f]/12 border border-[#ff3f7f]/25 rounded-full flex items-center justify-center flex-shrink-0">
                <Heart className="w-5 h-5 text-[#ff7aa6]" />
              </div>
              <div>
                <p className="text-sm text-[#d89075]">Religion</p>
                <p className="text-white">{profile.religion}</p>
              </div>
            </div>
          )}

          {profile.heightCm && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#ffd9aa]/10 border border-[#ffd9aa]/25 rounded-full flex items-center justify-center flex-shrink-0">
                <Ruler className="w-5 h-5 text-[#ffd9aa]" />
              </div>
              <div>
                <p className="text-sm text-[#d89075]">Height</p>
                <p className="text-white">{profile.heightCm} cm</p>
              </div>
            </div>
          )}

          {profile.preferredLanguage && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#ffd9aa]/10 border border-[#ffd9aa]/25 rounded-full flex items-center justify-center flex-shrink-0">
                <Globe2 className="w-5 h-5 text-[#ffd9aa]" />
              </div>
              <div>
                <p className="text-sm text-[#d89075]">Language</p>
                <p className="text-white">{profile.preferredLanguage}</p>
              </div>
            </div>
          )}

          {lookingFor && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#ff3f7f]/12 border border-[#ff3f7f]/25 rounded-full flex items-center justify-center flex-shrink-0">
                <Heart className="w-5 h-5 text-[#ff7aa6]" />
              </div>
              <div>
                <p className="text-sm text-[#d89075]">Looking for</p>
                <p className="text-white">{lookingFor}</p>
              </div>
            </div>
          )}
        </div>

        {(profileImages.length > 0 || profile.video) && (
          <div>
            <h3 className="mb-3 text-lg text-[#ffe1ae]">Photos</h3>
            {profileImages.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {profileImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => {
                      setActiveImageIndex(index);
                      setIsPhotoLightboxOpen(true);
                    }}
                    className="aspect-square w-full overflow-hidden rounded-2xl border border-[#d89075]/25"
                    aria-label={`Expand photo ${index + 1}`}
                  >
                    <img
                      src={image}
                      alt={`${profile.name} photo ${index + 1}`}
                      className="h-full w-full object-cover"
                      onError={useProfileImagePlaceholder}
                    />
                  </button>
                ))}
              </div>
            )}
            {profile.video && (
              <div className="mt-4">
                <h3 className="mb-3 text-lg text-[#ffe1ae]">Video</h3>
                <video
                  src={profile.video}
                  controls
                  className="aspect-video w-full rounded-2xl border border-[#d89075]/25 bg-black object-cover"
                />
              </div>
            )}
          </div>
        )}

        {/* Interests */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-5 h-5 text-[#ff3f7f]" />
            <h3 className="text-lg text-[#ffe1ae]">Interests</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((interest) => (
              <span
                key={interest}
                className="px-4 py-2 rounded-full border border-[#ff3f7f]/30 bg-[#ff3f7f]/10 text-sm text-[#ffd9aa]"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>

        {/* Edit Profile Button */}
        <button 
          onClick={onEditProfile}
          className="w-full py-3 bg-gradient-to-r from-[#f01c66] to-[#c9064f] text-white rounded-2xl hover:shadow-lg transition-shadow"
        >
          Edit Profile
        </button>
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
    </div>
  );
}
