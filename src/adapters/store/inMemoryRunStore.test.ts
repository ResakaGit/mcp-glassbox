import { describe, it, expect } from "vitest";
import { createInMemoryRunStore } from "./inMemoryRunStore.js";
import type { RawRunTelemetry } from "../../domain/telemetryTypes.js";

function sampleRun(id: string, startedAtMs: number): RawRunTelemetry {
  return {
    run_id: id,
    status: "FAILED",
    exit_code: 1,
    execution_time_ms: 100,
    browser_console_errors: ["err1"],
    network_failures: [
      { url: "https://a", method: "GET", status: 403, response_body: "Forbidden" },
    ],
    page_errors: [],
    backend_container_logs: ["[ERROR] something"],
    startedAtMs,
  };
}

describe("createInMemoryRunStore", () => {
  it("put y get devuelven el dato guardado", () => {
    const store = createInMemoryRunStore(10);
    const run = sampleRun("run-1", Date.now());
    store.put("run-1", run);
    expect(store.get("run-1")).toEqual(run);
    expect(store.get("run-2")).toBeNull();
  });

  it("query full_telemetry devuelve el run completo", () => {
    const store = createInMemoryRunStore(10);
    const run = sampleRun("run-1", Date.now());
    store.put("run-1", run);
    const result = store.query("run-1", { type: "full_telemetry" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual(run);
  });

  it("query network_by_status filtra por status", () => {
    const store = createInMemoryRunStore(10);
    const run = sampleRun("run-1", Date.now());
    run.network_failures.push({
      url: "https://b",
      method: "POST",
      status: 500,
      response_body: "Server error",
    });
    store.put("run-1", run);
    const result = store.query("run-1", {
      type: "network_by_status",
      status: 403,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({
        network_failures: [{ url: "https://a", method: "GET", status: 403, response_body: "Forbidden" }],
      });
    }
  });

  it("query con run_id inexistente devuelve error", () => {
    const store = createInMemoryRunStore(10);
    const result = store.query("missing", { type: "console_errors" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("run not found");
  });

  it("evicta por FIFO cuando se supera maxEntries", () => {
    const store = createInMemoryRunStore(3);
    store.put("a", sampleRun("a", 1));
    store.put("b", sampleRun("b", 2));
    store.put("c", sampleRun("c", 3));
    expect(store.get("a")).not.toBeNull();
    store.put("d", sampleRun("d", 4));
    expect(store.get("a")).toBeNull();
    expect(store.get("b")).not.toBeNull();
    expect(store.get("d")).not.toBeNull();
  });
});
