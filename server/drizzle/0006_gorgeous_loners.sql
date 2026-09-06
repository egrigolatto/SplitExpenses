ALTER TABLE "refresh_tokens" ADD COLUMN "familyId" uuid DEFAULT gen_random_uuid() NOT NULL;

UPDATE "refresh_tokens" SET "familyId" = "id";

ALTER TABLE "refresh_tokens" ALTER COLUMN "familyId" DROP DEFAULT;
