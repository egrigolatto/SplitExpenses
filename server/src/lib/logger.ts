import pino from "pino";

const isTest = process.env.NODE_ENV === "test";

export const logger = pino(
  isTest
    ? { enabled: false }
    : process.env.NODE_ENV !== "production"
      ? {
          transport: {
            target: "pino-pretty",
          },
        }
      : {},
);
