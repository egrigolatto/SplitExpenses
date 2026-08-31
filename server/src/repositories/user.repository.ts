import { db } from "../db/index.js";
import { users } from "../db/schema/users.js";
import { eq } from "drizzle-orm";

export class UserRepository {
  async findById(id: string) {
    return db.query.users.findFirst({
      where: eq(users.id, id),
    });
  }

  async findByEmail(email: string) {
    return db.query.users.findFirst({
      where: eq(users.email, email),
    });
  }

  async findByGoogleId(googleId: string) {
    return db.query.users.findFirst({
      where: eq(users.googleId, googleId),
    });
  }

  async linkGoogleId(id: string, googleId: string) {
    const [user] = await db
      .update(users)
      .set({ googleId, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    return user;
  }

  async create(data: typeof users.$inferInsert) {
    const [user] = await db.insert(users).values(data).returning();

    return user;
  }
}
