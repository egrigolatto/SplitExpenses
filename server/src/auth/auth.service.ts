import argon2 from "argon2";
import { AppError } from "../errors/app-error.js";
import { UserRepository } from "../repositories/user.repository.js";

export class AuthService {
  constructor(private readonly repository: UserRepository) {}

  registerUser = async ({
    name,
    email,
    password,
  }: {
    name: string;
    email: string;
    password: string;
  }) => {
    const existingUser = await this.repository.findByEmail(email);

    if (existingUser) {
      throw new AppError(409, "Email already registered");
    }

    const passwordHash = await argon2.hash(password);

    const user = await this.repository.create({
      name,
      email,
      passwordHash,
    });

    return user;
  };
}
