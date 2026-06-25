const { PrismaClient } = require("@prisma/client");

// Reuse a single Prisma instance across the app (avoids exhausting
// PostgreSQL connections during development hot-reloads).
const prisma = global.__prisma || new PrismaClient();
if (process.env.NODE_ENV === "development") global.__prisma = prisma;

module.exports = prisma;
