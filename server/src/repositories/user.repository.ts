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

  async create(data: typeof users.$inferInsert) {
    const [user] = await db.insert(users).values(data).returning();

    return user;
  }
}
