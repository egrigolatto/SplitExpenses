import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/users.service.js";

export class UserController {
  constructor(private readonly service: UserService) {}

  async getById(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
      const user = await this.service.findById(req.params.id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }
}
