import { UserRepository } from "../repositories/user.repository.js";

export class UserService {
  constructor(private readonly repository: UserRepository) {}

  async findById(id: string) {
    return this.repository.findById(id);
  }
}
