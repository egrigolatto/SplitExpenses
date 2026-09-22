import {
  AxiosError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { afterEach, describe, expect, it } from "vitest";

import { ApiRequestError, http } from "./http-client";
import { meetingsService } from "./meetings.service";

const USER_FIXTURE = {
  id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
  name: "Juan Pérez",
  email: "juan@email.com",
  googleId: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const MEETING_LIST_ENVELOPE = {
  success: true,
  data: { items: [], page: 1, limit: 10, total: 0, totalPages: 0 },
};

const REFRESH_ENVELOPE = {
  success: true,
  data: { user: USER_FIXTURE, accessToken: "access-token" },
};

const UNAUTHORIZED_BODY = { success: false, message: "Authentication required" };

type RouteResult = { status: number; data: unknown };

function installFakeAdapter(route: (key: string, callNumber: number) => RouteResult) {
  const calls: string[] = [];
  const counts: Record<string, number> = {};

  const adapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
    const key = `${config.method} ${config.url}`;
    counts[key] = (counts[key] ?? 0) + 1;
    calls.push(key);

    const { status, data } = route(key, counts[key] ?? 0);

    const response: AxiosResponse = {
      data,
      status,
      statusText: String(status),
      headers: {},
      config,
    };

    if (status >= 400) {
      throw new AxiosError("Request failed", String(status), config, {}, response);
    }

    return response;
  };

  http.defaults.adapter = adapter;

  return calls;
}

const originalAdapter = http.defaults.adapter;

afterEach(() => {
  delete http.defaults.adapter;
  if (originalAdapter !== undefined) {
    http.defaults.adapter = originalAdapter;
  }
});

describe("interceptor de autenticacion", () => {
  it("renueva la sesion y reintenta la peticion original ante un 401", async () => {
    const calls = installFakeAdapter((key, callNumber) => {
      if (key === "get /meetings" && callNumber === 1) {
        return { status: 401, data: UNAUTHORIZED_BODY };
      }
      if (key === "post /auth/refresh") {
        return { status: 200, data: REFRESH_ENVELOPE };
      }
      return { status: 200, data: MEETING_LIST_ENVELOPE };
    });

    const result = await meetingsService.list();

    expect(result.items).toEqual([]);
    expect(calls).toEqual(["get /meetings", "post /auth/refresh", "get /meetings"]);
  });

  it("propaga el 401 cuando el refresh falla, sin reintentos infinitos", async () => {
    const calls = installFakeAdapter((key, callNumber) => {
      if (key === "get /meetings" && callNumber === 1) {
        return { status: 401, data: UNAUTHORIZED_BODY };
      }
      if (key === "post /auth/refresh") {
        return { status: 401, data: UNAUTHORIZED_BODY };
      }
      return { status: 200, data: MEETING_LIST_ENVELOPE };
    });

    await expect(meetingsService.list()).rejects.toBeInstanceOf(ApiRequestError);
    expect(calls.filter((call) => call === "post /auth/refresh")).toHaveLength(1);
    expect(calls.filter((call) => call === "get /meetings")).toHaveLength(1);
  });

  it("comparte un unico refresh en vuelo entre peticiones paralelas", async () => {
    const calls = installFakeAdapter((key, callNumber) => {
      if (key === "get /meetings" && callNumber <= 2) {
        return { status: 401, data: UNAUTHORIZED_BODY };
      }
      if (key === "post /auth/refresh") {
        return { status: 200, data: REFRESH_ENVELOPE };
      }
      return { status: 200, data: MEETING_LIST_ENVELOPE };
    });

    const [first, second] = await Promise.all([meetingsService.list(), meetingsService.list()]);

    expect(first.total).toBe(0);
    expect(second.total).toBe(0);
    expect(calls.filter((call) => call === "post /auth/refresh")).toHaveLength(1);
  });

  it("mapea los errores de validacion del envelope a ApiRequestError", async () => {
    installFakeAdapter(() => ({
      status: 400,
      data: {
        success: false,
        message: "Validation failed",
        errors: [{ field: "name", message: "String must contain at least 2 character(s)" }],
      },
    }));

    const error = await meetingsService.list().catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ApiRequestError);
    expect((error as ApiRequestError).status).toBe(400);
    expect((error as ApiRequestError).fieldErrors[0]?.field).toBe("name");
  });
});
