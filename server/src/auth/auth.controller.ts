import { Request, Response, NextFunction } from "express";
import { AuthService } from "../auth/auth.service.js";
import { UserService } from "../services/users.service.js";
import { setAuthCookie, clearAuthCookie } from "../lib/cookies.js";

export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await this.authService.registerUser(req.body);

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { user, accessToken } = await this.authService.loginUser(req.body);

      setAuthCookie(res, accessToken);

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(_req: Request, res: Response, next: NextFunction) {
    try {
      clearAuthCookie(res);

      res.status(200).json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await this.userService.findById(req.user!.id);
      res.json({
        success: true,
        user: user,
      });
    } catch (error) {
      next(error);
    }
  }
}
