import { describe, it, expect } from "vitest";
import { getDomSnapshotAtTime } from "./getDomSnapshotAtTime.js";
import { createInMemoryRunStore } from "../adapters/store/inMemoryRunStore.js";
import type { RawRunTelemetry } from "../domain/telemetryTypes.js";

describe("getDomSnapshotAtTime", () => {
  it("devuelve error si run_id no existe", async () => {
    const runStore = createInMemoryRunStore(10);
    const traceReader = {
      getDomSnapshotAtTime: async () => null,
    };
    const result = await getDomSnapshotAtTime(
      { runStore, traceReader },
      "missing",
      1000
    );
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Run not found");
  });

  it("devuelve error si el run no tiene trace_path", async () => {
    const runStore = createInMemoryRunStore(10);
    const raw: RawRunTelemetry = {
      run_id: "r1",
      status: "OK",
      exit_code: 0,
      execution_time_ms: 50,
      browser_console_errors: [],
      network_failures: [],
      page_errors: [],
      backend_container_logs: [],
      startedAtMs: Date.now(),
    };
    runStore.put("r1", raw);
    const result = await getDomSnapshotAtTime(
      { runStore, traceReader: { getDomSnapshotAtTime: async () => null } },
      "r1",
      1000
    );
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("no trace_path");
  });

  it("devuelve snapshot cuando traceReader retorna texto", async () => {
    const runStore = createInMemoryRunStore(10);
    const raw: RawRunTelemetry = {
      run_id: "r1",
      status: "OK",
      exit_code: 0,
      execution_time_ms: 50,
      browser_console_errors: [],
      network_failures: [],
      page_errors: [],
      backend_container_logs: [],
      startedAtMs: Date.now(),
      trace_path: "/tmp/glassbox/r1/trace.zip",
    };
    runStore.put("r1", raw);
    const traceReader = {
      getDomSnapshotAtTime: async () => "<div>Hello</div>",
    };
    const result = await getDomSnapshotAtTime(
      { runStore, traceReader },
      "r1",
      1500
    );
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toBe("<div>Hello</div>");
  });
});
