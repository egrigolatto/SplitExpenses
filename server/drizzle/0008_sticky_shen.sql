CREATE INDEX "idx_meetings_owner_created" ON "meetings" USING btree ("ownerId","createdAt");--> statement-breakpoint
CREATE INDEX "idx_participants_meeting" ON "participants" USING btree ("meetingId");--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_family" ON "refresh_tokens" USING btree ("familyId");--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_user" ON "refresh_tokens" USING btree ("userId");