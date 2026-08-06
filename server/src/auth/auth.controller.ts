import { Request, Response, NextFunction } from "express";
import { AuthService } from "../auth/auth.service.js";

export class AuthController {
  constructor(private readonly service: AuthService) {}

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await this.service.registerUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }
}
