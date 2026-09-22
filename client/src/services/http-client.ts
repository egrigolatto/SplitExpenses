import axios, { type Axios, type AxiosError, type AxiosRequestConfig } from "axios";
import type { z } from "zod";

import { env } from "../config/env";
import { apiErrorSchema, successEnvelope, type ApiFieldError } from "../schemas/api.schema";

export class ApiRequestError extends Error {
  readonly status: number;
  readonly fieldErrors: readonly ApiFieldError[];

  constructor(status: number, message: string, fieldErrors: readonly ApiFieldError[] = []) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

type RetryableRequestConfig = AxiosRequestConfig & { _retriedAfterRefresh?: boolean };

const REFRESH_URL = "/auth/refresh";
const SESSION_BOOTSTRAP_URLS = ["/auth/login", "/auth/register", "/auth/refresh"];

let refreshInFlight: Promise<void> | null = null;

function refreshSession(): Promise<void> {
  refreshInFlight ??= http
    .post(REFRESH_URL)
    .then(() => undefined)
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

function toApiRequestError(error: AxiosError<unknown>): ApiRequestError {
  const status = error.response?.status ?? 0;

  if (status === 0) {
    return new ApiRequestError(0, "No se pudo conectar con el servidor");
  }

  const parsed = apiErrorSchema.safeParse(error.response?.data);

  if (!parsed.success) {
    return new ApiRequestError(status, "Error inesperado del servidor");
  }

  return new ApiRequestError(status, parsed.data.message, parsed.data.errors ?? []);
}

function createClient(baseURL: string): Axios {
  const client = axios.create({
    baseURL,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<unknown>) => {
      const config = error.config as RetryableRequestConfig | undefined;
      const url = config?.url ?? "";
      const isSessionBootstrap = SESSION_BOOTSTRAP_URLS.some((path) => url.startsWith(path));

      if (
        error.response?.status === 401 &&
        config !== undefined &&
        !config._retriedAfterRefresh &&
        !isSessionBootstrap
      ) {
        config._retriedAfterRefresh = true;

        try {
          await refreshSession();
          return await client.request(config);
        } catch {
          throw toApiRequestError(error);
        }
      }

      throw toApiRequestError(error);
    },
  );

  return client;
}

export const http = createClient(`${env.VITE_API_URL}/api/v1`);

export const httpRoot = createClient(env.VITE_API_URL);

export async function request<TSchema extends z.ZodType>(
  config: AxiosRequestConfig,
  dataSchema: TSchema,
  client: Axios = http,
): Promise<z.infer<TSchema>> {
  const response = await client.request<unknown>(config);
  const envelope = successEnvelope(dataSchema).parse(response.data) as {
    success: true;
    data: z.infer<TSchema>;
  };

  return envelope.data;
}

export async function requestVoid(config: AxiosRequestConfig, client: Axios = http): Promise<void> {
  await client.request<unknown>(config);
}
