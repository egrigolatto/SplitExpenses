import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/users.service.js";

export class UserController {
  constructor(private readonly service: UserService) {}

  async getById(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
      const user = await this.service.findById(req.params.id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      next(error);
    }
  }
}
