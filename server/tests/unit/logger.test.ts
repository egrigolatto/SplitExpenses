import pino from "pino";
import { describe, expect, it } from "vitest";

import { redactConfig } from "../../src/lib/logger.js";

function captureLogs(fn: (logger: pino.Logger) => void) {
  const lines: string[] = [];
  const stream = { write: (chunk: string) => void lines.push(chunk) };
  const logger = pino({ redact: redactConfig }, stream as unknown as NodeJS.WritableStream);

  fn(logger);

  return lines.join("\n");
}

describe("logger redaction", () => {
  it("should redact cookie and authorization request headers", () => {
    const output = captureLogs((logger) => {
      logger.info(
        {
          req: {
            headers: {
              cookie: "access_token=SUPERSECRETJWT",
              authorization: "Bearer SUPERSECRETJWT",
              host: "localhost:3000",
            },
          },
        },
        "request completed",
      );
    });

    expect(output).not.toContain("SUPERSECRETJWT");
    expect(output).toContain("[REDACTED]");
    expect(output).toContain("localhost:3000");
  });

  it("should redact set-cookie response headers", () => {
    const output = captureLogs((logger) => {
      logger.info(
        {
          res: {
            statusCode: 200,
            headers: {
              "set-cookie": ["access_token_refresh=SUPERSECRETJWT"],
            },
          },
        },
        "request completed",
      );
    });

    expect(output).not.toContain("SUPERSECRETJWT");
    expect(output).toContain("[REDACTED]");
  });
});
