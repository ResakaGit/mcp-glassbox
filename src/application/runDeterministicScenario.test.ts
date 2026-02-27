import { describe, it, expect } from "vitest";
import { runDeterministicScenario } from "./runDeterministicScenario.js";
import { createInMemoryRunStore } from "../adapters/store/inMemoryRunStore.js";
import type { RunDeterministicScenarioPorts } from "./runDeterministicScenario.js";

function mockPorts(overrides?: Partial<RunDeterministicScenarioPorts>): RunDeterministicScenarioPorts {
  const runStore = createInMemoryRunStore(10);
  return {
    processRunner: { run: async () => ({ exitCode: 0, durationMs: 20 }) },
    containerLogs: { getLogsSince: async () => [] },
    browserTelemetry: {
      runAndCollect: async (runFn) => {
        const runResult = await runFn();
        return {
          runResult,
          snapshot: {
            console_errors: [],
            network_failures: [],
            page_errors: [],
          },
        };
      },
    },
    runStore,
    sourceMapResolver: null,
    ...overrides,
  };
}

describe("runDeterministicScenario", () => {
  it("devuelve passed, run_id, trace_id y guarda en runStore con trace_path", async () => {
    const ports = mockPorts();
    const result = await runDeterministicScenario(
      ports,
      {
        entry_command: "npx playwright test",
        sandbox_id: "sb1",
        target_containers: [],
        restore_savepoint_after: false,
      },
      { timeoutMs: 5000 }
    );
    expect(result.isError).toBeFalsy();
    const data = JSON.parse(result.content[0].text);
    expect(data.passed).toBe(true);
    expect(data.run_id).toBeDefined();
    expect(data.trace_id).toMatch(/^req_[a-f0-9]+$/);
    expect(data.exit_code).toBe(0);
    const raw = ports.runStore.get(data.run_id);
    expect(raw).not.toBeNull();
    expect(raw!.trace_id).toBe(data.trace_id);
    expect(raw!.trace_path).toBeDefined();
    expect(raw!.trace_path).toContain("trace.zip");
  });

  it("devuelve error si restore_savepoint_after es true pero no hay savepoint configurado", async () => {
    const ports = mockPorts();
    const result = await runDeterministicScenario(
      ports,
      {
        entry_command: "npx playwright test",
        sandbox_id: "sb1",
        target_containers: [],
        restore_savepoint_after: true,
        savepoint_name: "db_clean",
      },
      { timeoutMs: 5000 }
    );
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Savepoint not configured");
  });
});
