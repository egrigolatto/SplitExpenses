CREATE TYPE "public"."revocation_reason" AS ENUM('rotated', 'logout', 'reuse');--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD COLUMN "revokedReason" "revocation_reason";