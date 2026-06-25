/**
 * Matching algorithm.
 *
 * Scores candidate profiles for a given user based on:
 *  - Shared interests (music, movies, religion, education etc.)  -> weight 40%
 *  - Distance (closer is better, haversine formula)               -> weight 30%
 *  - Age closeness to user's own age                               -> weight 20%
 *  - Profile completeness / verification (boosts trust)            -> weight 10%
 *
 * This is intentionally simple and explainable so you can tune the
 * weights as you gather real engagement data. Swap in a proper
 * ML-based ranker later if you want.
 */

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some((v) => v === null || v === undefined)) {
    return null;
  }
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function ageFromDob(dob) {
  if (!dob) return null;
  const diffMs = Date.now() - new Date(dob).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
}

function scoreCandidate(user, candidate) {
  let score = 0;

  // --- Interests overlap (40%) ---
  const userInterestIds = new Set(user.interests.map((i) => i.interestId));
  const candidateInterestIds = new Set(
    candidate.interests.map((i) => i.interestId)
  );
  const overlap = [...userInterestIds].filter((id) =>
    candidateInterestIds.has(id)
  ).length;
  const maxPossible = Math.max(userInterestIds.size, 1);
  score += (overlap / maxPossible) * 40;

  // Bonus: same religion / same education background (soft signal, optional)
  if (user.religion && candidate.religion && user.religion === candidate.religion) {
    score += 5;
  }
  if (user.education && candidate.education && user.education === candidate.education) {
    score += 5;
  }

  // --- Distance (30%) ---
  const distanceKm = haversineDistanceKm(
    user.latitude,
    user.longitude,
    candidate.latitude,
    candidate.longitude
  );
  if (distanceKm !== null) {
    const distanceScore = Math.max(0, 30 - distanceKm / 5); // loses ~1pt per 5km
    score += Math.max(0, Math.min(30, distanceScore));
  }

  // --- Age closeness (20%) ---
  const userAge = ageFromDob(user.dob);
  const candidateAge = ageFromDob(candidate.dob);
  if (userAge && candidateAge) {
    const ageDiff = Math.abs(userAge - candidateAge);
    score += Math.max(0, 20 - ageDiff * 2);
  }

  // --- Trust / verification (10%) ---
  if (candidate.isVerified) score += 7;
  if (candidate.photos.length >= 2) score += 3;

  return Math.round(score * 100) / 100;
}

/**
 * Ranks an array of candidate users for a given user, highest match first.
 */
function rankCandidates(user, candidates) {
  return candidates
    .map((c) => ({ user: c, score: scoreCandidate(user, c) }))
    .sort((a, b) => b.score - a.score);
}

module.exports = { haversineDistanceKm, ageFromDob, scoreCandidate, rankCandidates };
