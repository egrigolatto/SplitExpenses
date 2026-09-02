import argon2 from "argon2";
import { AppError } from "../errors/app-error.js";
import { UserRepository } from "../repositories/user.repository.js";
import { generateAccessToken } from "../lib/jwt.js";
import { CreateUserDto } from "../schemas/user.schema.js";
import { LoginDto } from "../schemas/auth.schema.js";

export class AuthService {
  constructor(private readonly repository: UserRepository) {}

  private sanitizeUser<T extends { passwordHash?: string | null }>(user: T) {
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  async registerUser(dto: CreateUserDto) {
    const { name, password } = dto;
    const email = this.normalizeEmail(dto.email);
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

    if (!user) {
      throw new AppError(500, "User could not be created");
    }

    return this.sanitizeUser(user);
  }

  async loginUser(dto: LoginDto) {
    const { password } = dto;
    const email = this.normalizeEmail(dto.email);
    const user = await this.repository.findByEmail(email);

    if (!user || !user.passwordHash) {
      throw new AppError(401, "Invalid credentials");
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, password);

    if (!isPasswordValid) {
      throw new AppError(401, "Invalid credentials");
    }

    const accessToken = generateAccessToken({ sub: user.id });
    const safeUser = this.sanitizeUser(user);

    return { user: safeUser, accessToken };
  }
}
