-- Migration: Add Instagram/Spotify social links to User
-- Also adds MONTHLY/YEARLY to SubscriptionPlan enum

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "instagramHandle" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "spotifyUsername" TEXT;

-- Extend the SubscriptionPlan enum with new values
-- (PostgreSQL requires this specific syntax)
ALTER TYPE "SubscriptionPlan" ADD VALUE IF NOT EXISTS 'MONTHLY';
ALTER TYPE "SubscriptionPlan" ADD VALUE IF NOT EXISTS 'YEARLY';
