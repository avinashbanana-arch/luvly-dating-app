/**
 * Religion options offered on Signup and Edit Profile. Stored on the user
 * record as-is (plain string), matching how this field is already rendered
 * everywhere it's displayed (e.g. PublicProfileDetails shows
 * `profile.religion` verbatim, with no code-to-label lookup) — so the values
 * here are the exact display labels, not enum codes.
 */
export const RELIGION_OPTIONS = [
  "Hindu",
  "Muslim",
  "Christian",
  "Sikh",
  "Buddhist",
  "Jain",
  "Jewish",
  "Other",
  "Prefer not to say",
];
