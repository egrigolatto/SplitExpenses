import { Request, Response, NextFunction } from "express";
import { AuthService } from "../auth/auth.service.js";
import { UserService } from "../services/users.service.js";
import { setAuthCookies, clearAuthCookies, refreshCookieName } from "../lib/cookies.js";

export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { user, accessToken, refreshToken } = await this.authService.registerUser(req.body);

      setAuthCookies(res, { accessToken, refreshToken });

      res.status(201).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { user, accessToken, refreshToken } = await this.authService.loginUser(req.body);

      setAuthCookies(res, { accessToken, refreshToken });

      res.status(200).json({
        success: true,
        data: {
          user,
          accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const rawRefreshToken = req.cookies[refreshCookieName] as string | undefined;

      if (!rawRefreshToken) {
        res.clearCookie(refreshCookieName);
        res.status(401).json({
          success: false,
          message: "Refresh token not provided",
        });
        return;
      }

      const { user, accessToken, refreshToken } =
        await this.authService.refreshSession(rawRefreshToken);

      setAuthCookies(res, { accessToken, refreshToken });

      res.status(200).json({
        success: true,
        data: {
          user,
          accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const rawRefreshToken = req.cookies[refreshCookieName] as string | undefined;

      if (rawRefreshToken) {
        await this.authService.logout(rawRefreshToken);
      }

      clearAuthCookies(res);

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
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}
