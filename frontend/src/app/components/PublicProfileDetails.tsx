/**
 * Shared presentation for another member's public profile. Deliberately does
 * not accept email, phone, tokens, ids, or account/subscription fields.
 */
export interface PublicProfileDetailsData {
  bio?: string;
  location?: string;
  country?: string;
  gender?: string;
  occupation?: string;
  jobTitle?: string;
  education?: string;
  religion?: string;
  heightCm?: number | "";
  preferredLanguage?: string;
  ethnicity?: string;
  zodiacSign?: string;
  preference?: string;
  interests?: string[];
  prompts?: Array<{ question: string; answer: string }>;
  communities?: string[];
  isVerified?: boolean;
  video?: string;
  images?: string[];
}

function readable(value?: string) {
  return value ? value.replace(/_/g, " ") : "";
}

export function PublicProfileDetails({ profile, className = "", showPhotos = false }: { profile: PublicProfileDetailsData; className?: string; showPhotos?: boolean }) {
  const fields = [
    ["Location", profile.location],
    ["Country", profile.country ? getCountryName(profile.country) : ""],
    ["Gender", readable(profile.gender)],
    ["Height", profile.heightCm ? `${profile.heightCm} cm` : ""],
    ["Occupation", profile.occupation],
    ["Role", profile.jobTitle],
    ["Education", profile.education],
    ["Religion", profile.religion],
    ["Language", profile.preferredLanguage],
    ["Ethnicity", profile.ethnicity],
    ["Zodiac", profile.zodiacSign],
    ["Looking for", profile.preference],
  ].filter(([, value]) => Boolean(value));

  return (
    <div className={`space-y-4 ${className}`}>
      {showPhotos && !!profile.images?.length && (
        <div className="grid grid-cols-3 gap-2">
          {profile.images.map((image, index) => <img key={`${image}-${index}`} src={image} alt={`Profile photo ${index + 1}`} className="aspect-square w-full rounded-lg object-cover" />)}
        </div>
      )}
      {profile.bio && <p className="text-sm leading-6 text-white/70">{profile.bio}</p>}
      {profile.isVerified && <p className="text-xs font-semibold text-[#82e8be]">Verified profile</p>}
      {fields.length > 0 && (
        <dl className="grid grid-cols-1 gap-x-5 gap-y-2 text-sm sm:grid-cols-2">
          {fields.map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-xs text-[#d89075]">{label}</dt>
              <dd className="break-words text-white/80">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {!!profile.interests?.length && (
        <div>
          <p className="mb-2 text-xs text-[#d89075]">Interests</p>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((interest) => <span key={interest} className="rounded-full border border-[#ff3f7f]/30 bg-[#ff3f7f]/10 px-3 py-1 text-xs text-[#ffd9aa]">{interest}</span>)}
          </div>
        </div>
      )}
      {!!profile.communities?.length && <p className="text-sm text-white/60">Communities: {profile.communities.join(", ")}</p>}
      {profile.video && (
        <video src={profile.video} controls className="aspect-video w-full rounded-xl border border-[#d89075]/25 bg-black object-cover" />
      )}
      {!!profile.prompts?.length && (
        <div className="space-y-2">
          {profile.prompts.filter((prompt) => prompt.question && prompt.answer).map((prompt) => (
            <div key={`${prompt.question}-${prompt.answer}`} className="rounded-xl border border-[#d89075]/25 bg-white/5 p-3">
              <p className="text-xs text-[#d89075]">{prompt.question}</p>
              <p className="mt-1 text-sm text-white/80">{prompt.answer}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
import { getCountryName } from "../../lib/countries";
