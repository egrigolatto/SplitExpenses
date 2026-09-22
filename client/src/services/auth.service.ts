import { authSessionSchema, type LoginRequest, type RegisterRequest } from "../schemas/auth.schema";
import { publicUserSchema, type PublicUser } from "../schemas/user.schema";
import { request, requestVoid } from "./http-client";

export const authService = {
  register(input: RegisterRequest): Promise<PublicUser> {
    return request({ method: "post", url: "/auth/register", data: input }, publicUserSchema);
  },

  login(input: LoginRequest) {
    return request({ method: "post", url: "/auth/login", data: input }, authSessionSchema);
  },

  refresh() {
    return request({ method: "post", url: "/auth/refresh" }, authSessionSchema);
  },

  logout(): Promise<void> {
    return requestVoid({ method: "post", url: "/auth/logout" });
  },

  me(): Promise<PublicUser> {
    return request({ method: "get", url: "/auth/me" }, publicUserSchema);
  },
};
