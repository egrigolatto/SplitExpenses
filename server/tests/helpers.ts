import { randomUUID } from "node:crypto";

import supertest from "supertest";
import { sql } from "drizzle-orm";

import { db } from "../src/db/index.js";
import app from "../src/app.js";

export const request = supertest(app);

export interface TestUser {
  name: string;
  email: string;
  password: string;
}

export function buildUser(overrides: Partial<TestUser> = {}): TestUser {
  const unique = randomUUID();
  return {
    name: "Test User",
    email: `user-${unique}@example.com`,
    password: "password123",
    ...overrides,
  };
}

export async function cleanDatabase() {
  await db.execute(sql`TRUNCATE TABLE participants RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE meetings RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE users RESTART IDENTITY CASCADE`);
}

export async function registerAndLogin(user: TestUser = buildUser()) {
  const agent = supertest.agent(app);

  const register = await agent.post("/api/v1/auth/register").send(user);
  const login = await agent.post("/api/v1/auth/login").send({
    email: user.email,
    password: user.password,
  });

  if (login.status !== 200) {
    throw new Error(`Login failed: ${login.status} ${login.text}`);
  }

  const id = register.body.data?.id as string | undefined;

  return { agent, user, id };
}

export function createMeetingPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: "Asado sábado",
    totalAmount: 1000,
    participantList: [
      { name: "Juan", paidAmount: 500, isOwner: true },
      { name: "Pedro", paidAmount: 500, isOwner: false },
    ],
    ...overrides,
  };
}
