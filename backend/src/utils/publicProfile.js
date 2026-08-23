/**
 * The only user shape that may be returned for somebody other than the
 * authenticated member.  Keep authentication and account fields (phone,
 * email, password, tokens and subscription state) out of social endpoints.
 */
const publicProfileSelect = {
  id: true,
  name: true,
  dob: true,
  gender: true,
  lookingFor: true,
  bio: true,
  latitude: true,
  longitude: true,
  city: true,
  country: true,
  preferredLanguage: true,
  religion: true,
  heightCm: true,
  education: true,
  ethnicity: true,
  occupation: true,
  jobTitle: true,
  zodiacSign: true,
  videoUrl: true,
  prompts: true,
  communities: true,
  isVerified: true,
  verificationStatus: true,
  photos: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] },
  interests: { include: { interest: true } },
};

function toPublicProfile(user) {
  if (!user) return null;
  // Destructure deliberately rather than spreading so newly added private
  // database fields cannot accidentally become public API fields.
  return {
    id: user.id,
    name: user.name,
    dob: user.dob,
    gender: user.gender,
    lookingFor: user.lookingFor,
    bio: user.bio,
    latitude: user.latitude,
    longitude: user.longitude,
    city: user.city,
    country: user.country,
    preferredLanguage: user.preferredLanguage,
    religion: user.religion,
    heightCm: user.heightCm,
    education: user.education,
    ethnicity: user.ethnicity,
    occupation: user.occupation,
    jobTitle: user.jobTitle,
    zodiacSign: user.zodiacSign,
    videoUrl: user.videoUrl,
    prompts: user.prompts,
    communities: user.communities,
    isVerified: user.isVerified,
    verificationStatus: user.verificationStatus,
    photos: user.photos || [],
    interests: user.interests || [],
  };
}

module.exports = { publicProfileSelect, toPublicProfile };
