import pino from "pino";

const isTest = process.env.NODE_ENV === "test";

export const redactConfig = {
  paths: ["req.headers.cookie", "req.headers.authorization", "res.headers['set-cookie']"],
  censor: "[REDACTED]",
};

export const logger = pino(
  isTest
    ? { enabled: false, redact: redactConfig }
    : process.env.NODE_ENV !== "production"
      ? {
          redact: redactConfig,
          transport: {
            target: "pino-pretty",
          },
        }
      : { redact: redactConfig },
);
