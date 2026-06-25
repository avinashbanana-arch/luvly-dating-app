import { Settings, Edit, MapPin, Briefcase, GraduationCap, Heart , AlertTriangle } from "lucide-react";

interface UserProfile {
  name: string;
  age: number;
  image: string;
  bio: string;
  location: string;
  occupation: string;
  education: string;
  zodiacSign?: string;
  interests: string[];
}

interface ProfileViewProps {
  profile: UserProfile;
  onSettings: () => void;
  onEditProfile: () => void;
}

export function ProfileView({ profile, onSettings, onEditProfile }: ProfileViewProps) {
  return (
    <div className="h-full bg-white overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b flex items-center justify-between">
        <h1 className="text-2xl">Profile</h1>
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" onClick={onSettings}>
          <Settings className="w-6 h-6" />
        </button>
      </div>

      {/* Profile Image */}
      <div className="relative">
        <img
          src={profile.image}
          alt={profile.name}
          className="w-full h-96 object-cover"
        />
        <button className="absolute bottom-4 right-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors" onClick={onEditProfile}>
          <Edit className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Profile Info */}
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-3xl mb-2">
            {profile.name}, {profile.age}
          </h2>
          <p className="text-gray-600">{profile.bio}</p>
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-pink-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="text-gray-900">{profile.location}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Occupation</p>
              <p className="text-gray-900">{profile.occupation}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Education</p>
              <p className="text-gray-900">{profile.education}</p>
            </div>
          </div>

          {profile.zodiacSign && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl">✨</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Zodiac Sign</p>
                <p className="text-gray-900">{profile.zodiacSign}</p>
              </div>
            </div>
          )}
        </div>

        {/* Interests */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-5 h-5 text-pink-500" />
            <h3 className="text-lg">Interests</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((interest) => (
              <span
                key={interest}
                className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>

        {/* Edit Profile Button */}
        <button 
          onClick={onEditProfile}
          className="w-full py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full hover:shadow-lg transition-shadow"
        >
          Edit Profile
        </button>
      </div>
    </div>
  );
}