import { type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";

import { statsResponseSchema, type StatsResponse } from "../schemas/stats.schema";
import { http } from "./http-client";
import { statsService } from "./stats.service";

function statsFixture(): StatsResponse {
  return {
    total: { meetings: 3, amount: 640.5, myAmount: 213.5 },
    current: {
      month: { key: "2026-10", meetings: 1, amount: 340.5 },
      year: { key: "2026", meetings: 2, amount: 440.5 },
    },
    averagePerMeeting: 213.5,
    monthly: Array.from({ length: 12 }, (_, index) => ({
      key: `2026-${String(index + 1).padStart(2, "0")}`,
      meetings: 0,
      amount: 0,
      myAmount: 0,
    })),
  };
}

function installAdapter(buildResponse: () => unknown) {
  let captured: {
    url: string | undefined;
    params: Record<string, unknown> | undefined;
  } = { url: undefined, params: undefined };

  const adapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
    captured = { url: config.url, params: config.params as Record<string, unknown> | undefined };

    const response: AxiosResponse = {
      data: buildResponse(),
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    };

    return response;
  };

  http.defaults.adapter = adapter;

  return () => captured;
}

describe("statsResponseSchema", () => {
  it("acepta una respuesta valida del server", () => {
    expect(statsResponseSchema.safeParse(statsFixture()).success).toBe(true);
  });

  it("rechaza una serie que no cubre 12 meses", () => {
    const broken = statsFixture();

    broken.monthly = broken.monthly.slice(0, 6);

    expect(statsResponseSchema.safeParse(broken).success).toBe(false);
  });

  it("rechaza importes negativos", () => {
    const broken = statsFixture();

    broken.total = { meetings: 1, amount: -5, myAmount: 0 };

    expect(statsResponseSchema.safeParse(broken).success).toBe(false);
  });
});

describe("statsService", () => {
  it("pide /stats con la zona horaria y devuelve datos validados", async () => {
    const getCaptured = installAdapter(() => ({ success: true, data: statsFixture() }));

    const stats = await statsService.getStats("America/Argentina/Buenos_Aires");

    expect(getCaptured()).toEqual({
      url: "/stats",
      params: { tz: "America/Argentina/Buenos_Aires" },
    });
    expect(stats.total).toEqual({ meetings: 3, amount: 640.5, myAmount: 213.5 });

    delete http.defaults.adapter;
  });

  it("falla si la respuesta no respeta el contrato", async () => {
    installAdapter(() => ({ success: true, data: { total: { meetings: 0 } } }));

    await expect(statsService.getStats("UTC")).rejects.toThrow();

    delete http.defaults.adapter;
  });
});
