ALTER TABLE "User"
ADD COLUMN "occupation" TEXT,
ADD COLUMN "ethnicity" TEXT,
ADD COLUMN "jobTitle" TEXT,
ADD COLUMN "zodiacSign" TEXT,
ADD COLUMN "videoUrl" TEXT,
ADD COLUMN "prompts" JSONB,
ADD COLUMN "communities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
