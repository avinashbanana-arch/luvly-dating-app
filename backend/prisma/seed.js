/**
 * Seeds common interest tags relevant to Indian users across the
 * categories requested: music, movies, religion, education, sports, lifestyle.
 * Run with: node prisma/seed.js
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const INTERESTS = [
  // Music
  { name: "Bollywood Music", category: "music" },
  { name: "Classical (Hindustani/Carnatic)", category: "music" },
  { name: "Punjabi Music", category: "music" },
  { name: "Indie/English Music", category: "music" },
  // Movies
  { name: "Bollywood", category: "movies" },
  { name: "South Indian Cinema", category: "movies" },
  { name: "Hollywood", category: "movies" },
  { name: "Anime", category: "movies" },
  // Religion / spirituality (optional, sensitive — keep self-reported and optional)
  { name: "Hindu", category: "religion" },
  { name: "Muslim", category: "religion" },
  { name: "Christian", category: "religion" },
  { name: "Sikh", category: "religion" },
  { name: "Buddhist", category: "religion" },
  { name: "Jain", category: "religion" },
  { name: "Spiritual but not religious", category: "religion" },
  { name: "Prefer not to say", category: "religion" },
  // Education
  { name: "Engineering", category: "education" },
  { name: "Medicine", category: "education" },
  { name: "MBA/Business", category: "education" },
  { name: "Arts & Humanities", category: "education" },
  { name: "Law", category: "education" },
  // Sports / lifestyle
  { name: "Cricket", category: "sports" },
  { name: "Travel", category: "lifestyle" },
  { name: "Fitness/Gym", category: "lifestyle" },
  { name: "Foodie", category: "lifestyle" },
  { name: "Yoga", category: "lifestyle" },
];

async function main() {
  for (const interest of INTERESTS) {
    await prisma.interest.upsert({
      where: { name: interest.name },
      update: { category: interest.category },
      create: interest,
    });
  }
  // eslint-disable-next-line no-console
  console.log(`Seeded ${INTERESTS.length} interests.`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
