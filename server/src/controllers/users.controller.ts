import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/users.service.js";
import { AppError } from "../errors/app-error.js";

export class UserController {
  constructor(private readonly service: UserService) {}

  async getById(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
      const user = await this.service.findById(req.params.id);
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(401, "Unauthorized");
      }

      const user = await this.service.update(userId, req.body);
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }
}
