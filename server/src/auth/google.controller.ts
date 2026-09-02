import { Request, Response, NextFunction } from "express";

import { GoogleAuthService } from "./google.service.js";
import { AppError } from "../errors/app-error.js";
import { setAuthCookie } from "../lib/cookies.js";
import { env } from "../config/env.js";

export class GoogleAuthController {
  constructor(private readonly googleAuthService: GoogleAuthService) {}

  async redirectToGoogle(_req: Request, res: Response, next: NextFunction) {
    try {
      const { url } = await this.googleAuthService.getAuthUrl();

      res.redirect(url);
    } catch (error) {
      next(error);
    }
  }

  async callback(req: Request, res: Response, next: NextFunction) {
    const code = req.query.code as string | undefined;
    const state = req.query.state as string | undefined;

    if (!code || !state) {
      next(new AppError(400, "Missing code or state"));
      return;
    }

    try {
      const { accessToken } = await this.googleAuthService.handleCallback(code, state);

      setAuthCookie(res, accessToken);

      res.redirect(env.frontendUrl);
    } catch (error) {
      if (error instanceof AppError) {
        const url = new URL(env.frontendUrl);
        url.searchParams.set("error", error.message);

        res.redirect(url.toString());
        return;
      }

      next(error);
    }
  }
}
