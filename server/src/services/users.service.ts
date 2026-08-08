import { UserRepository } from "../repositories/user.repository.js";
import { AppError } from "../errors/app-error.js";
export class UserService {
  constructor(private readonly repository: UserRepository) {}

  private sanitizeUser<T extends { passwordHash?: string | null }>(user: T) {
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async findById(id: string) {
    const user = await this.repository.findById(id);

    if (!user) {
      throw new AppError(404, "User not found");
    }

    return this.sanitizeUser(user);
  }
}
