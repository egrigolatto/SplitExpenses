import { UserRepository } from "../repositories/user.repository.js";
import { AppError } from "../errors/app-error.js";
import { toPublicUser } from "../lib/user-serializer.js";
import { UpdateUserDto } from "../schemas/user.schema.js";
export class UserService {
  constructor(private readonly repository: UserRepository) {}

  async findById(id: string) {
    const user = await this.repository.findById(id);

    if (!user) {
      throw new AppError(404, "User not found");
    }

    return toPublicUser(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    if (dto.email !== undefined) {
      const normalizedEmail = dto.email.trim().toLowerCase();
      const userWithEmail = await this.repository.findByEmail(normalizedEmail);

      if (userWithEmail && userWithEmail.id !== id) {
        throw new AppError(409, "Email already in use");
      }

      dto = { ...dto, email: normalizedEmail };
    }

    const updateData: { name?: string; email?: string } = {};
    if (dto.name !== undefined) {
      updateData.name = dto.name;
    }
    if (dto.email !== undefined) {
      updateData.email = dto.email;
    }

    const user = await this.repository.update(id, updateData);

    if (!user) {
      throw new AppError(404, "User not found");
    }

    return toPublicUser(user);
  }
}
