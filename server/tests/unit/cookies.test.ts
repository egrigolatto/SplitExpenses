import { describe, expect, it, vi } from "vitest";

interface CookieCall {
  name: string;
  value: string;
  options: Record<string, unknown>;
}

function fakeResponse() {
  const calls: CookieCall[] = [];

  const res = {
    cookie(name: string, value: string, options: Record<string, unknown>) {
      calls.push({ name, value, options });
      return res;
    },
  };

  return { res: res as never, calls };
}

async function loadCookies(envOverrides: {
  nodeEnv: string;
  cookieSameSite: "strict" | "lax" | "none";
}) {
  vi.resetModules();
  vi.doMock("../../src/config/env.js", () => ({
    env: {
      nodeEnv: envOverrides.nodeEnv,
      cookieName: "access_token",
      cookieSameSite: envOverrides.cookieSameSite,
    },
  }));

  return import("../../src/lib/cookies.js");
}

describe("setAuthCookies", () => {
  it("usa lax y sin Secure en desarrollo por defecto", async () => {
    const { setAuthCookies } = await loadCookies({
      nodeEnv: "development",
      cookieSameSite: "lax",
    });
    const { res, calls } = fakeResponse();

    setAuthCookies(res, { accessToken: "access", refreshToken: "refresh" });

    expect(calls.map((call) => call.name)).toEqual(["access_token", "access_token_refresh"]);
    expect(calls[0]?.options).toMatchObject({
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
    });
    expect(calls[1]?.options).toMatchObject({
      sameSite: "lax",
      secure: false,
      path: "/api/v1/auth",
    });
  });

  it("activa Secure en produccion manteniendo lax", async () => {
    const { setAuthCookies } = await loadCookies({
      nodeEnv: "production",
      cookieSameSite: "lax",
    });
    const { res, calls } = fakeResponse();

    setAuthCookies(res, { accessToken: "access", refreshToken: "refresh" });

    expect(calls[0]?.options).toMatchObject({ sameSite: "lax", secure: true });
  });

  it("fuerza Secure junto a SameSite=none para sesiones cross-site", async () => {
    const { setAuthCookies } = await loadCookies({
      nodeEnv: "development",
      cookieSameSite: "none",
    });
    const { res, calls } = fakeResponse();

    setAuthCookies(res, { accessToken: "access", refreshToken: "refresh" });

    expect(calls[0]?.options).toMatchObject({ sameSite: "none", secure: true, httpOnly: true });
    expect(calls[1]?.options).toMatchObject({ sameSite: "none", secure: true });
  });

  it("omite la cookie de refresh cuando no se provee token", async () => {
    const { setAuthCookies } = await loadCookies({
      nodeEnv: "development",
      cookieSameSite: "lax",
    });
    const { res, calls } = fakeResponse();

    setAuthCookies(res, { accessToken: "access" });

    expect(calls).toHaveLength(1);
    expect(calls[0]?.name).toBe("access_token");
  });
});

describe("clearAuthCookies", () => {
  it("elimina ambas cookies replicando los atributos con los que fueron creadas", async () => {
    const { clearAuthCookies } = await loadCookies({
      nodeEnv: "production",
      cookieSameSite: "none",
    });

    const cleared: Array<{ name: string; options: Record<string, unknown> }> = [];
    const res = {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        cleared.push({ name, options });
        return res;
      },
    };

    clearAuthCookies(res as never);

    expect(cleared[0]).toEqual({
      name: "access_token",
      options: { httpOnly: true, secure: true, sameSite: "none", path: "/" },
    });
    expect(cleared[1]).toEqual({
      name: "access_token_refresh",
      options: { httpOnly: true, secure: true, sameSite: "none", path: "/api/v1/auth" },
    });
  });
});
