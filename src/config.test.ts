import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getConfig } from "./config.js";

const ENV_KEY = "GLASSBOX_EXECUTE_TIMEOUT_MS";

describe("getConfig", () => {
  const orig = process.env[ENV_KEY];

  beforeEach(() => {
    delete process.env[ENV_KEY];
  });
  afterEach(() => {
    if (orig !== undefined) process.env[ENV_KEY] = orig;
  });

  it("devuelve EXECUTE_TIMEOUT_MS 120000 por defecto", () => {
    const c = getConfig();
    expect(c.EXECUTE_TIMEOUT_MS).toBe(120_000);
  });

  it("trunca valores negativos a default", () => {
    process.env[ENV_KEY] = "-1";
    const c = getConfig();
    expect(c.EXECUTE_TIMEOUT_MS).toBe(120_000);
  });

  it("acepta 0 como sin timeout desde env", () => {
    process.env[ENV_KEY] = "0";
    const c = getConfig();
    expect(c.EXECUTE_TIMEOUT_MS).toBe(0);
  });

  it("usa el valor numérico válido del entorno", () => {
    process.env[ENV_KEY] = "30000";
    const c = getConfig();
    expect(c.EXECUTE_TIMEOUT_MS).toBe(30_000);
  });

  it("devuelve defaults V3 (TRUNCATE_BODY_CHARS, RUN_STORE_MAX_ENTRIES, BACKEND_LOG_LEVELS)", () => {
    const c = getConfig();
    expect(c.TRUNCATE_BODY_CHARS).toBe(500);
    expect(c.RUN_STORE_MAX_ENTRIES).toBe(50);
    expect(c.BACKEND_LOG_LEVELS).toEqual(["WARN", "ERROR"]);
  });
});
