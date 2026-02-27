import { describe, it, expect } from "vitest";
import {
  executeWithTelemetrySchema,
  createSandboxSavepointSchema,
  runDeterministicScenarioSchema,
  inspectTraceCorrelationSchema,
  getDomSnapshotAtTimeSchema,
} from "./schemas.js";

describe("executeWithTelemetrySchema", () => {
  it("acepta target_containers con nombres no vacíos", () => {
    const result = executeWithTelemetrySchema.safeParse({
      sandbox_id: "sb1",
      entry_command: "npx playwright test",
      target_containers: ["backend", "db"],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.target_containers).toEqual(["backend", "db"]);
  });

  it("rechaza target_containers con string vacío", () => {
    const result = executeWithTelemetrySchema.safeParse({
      sandbox_id: "sb1",
      entry_command: "npx playwright test",
      target_containers: ["backend", ""],
    });
    expect(result.success).toBe(false);
  });

  it("rechaza entry_command vacío", () => {
    const result = executeWithTelemetrySchema.safeParse({
      sandbox_id: "sb1",
      entry_command: "",
      target_containers: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("createSandboxSavepointSchema", () => {
  it("acepta savepoint_name no vacío", () => {
    const result = createSandboxSavepointSchema.safeParse({
      savepoint_name: "db_migrada",
    });
    expect(result.success).toBe(true);
  });
  it("rechaza savepoint_name vacío", () => {
    expect(createSandboxSavepointSchema.safeParse({ savepoint_name: "" }).success).toBe(false);
  });
});

describe("runDeterministicScenarioSchema", () => {
  it("acepta entry_command, restore_savepoint_after, sandbox_id", () => {
    const result = runDeterministicScenarioSchema.safeParse({
      entry_command: "npx playwright test",
      sandbox_id: "sb1",
      restore_savepoint_after: true,
      savepoint_name: "db_clean",
    });
    expect(result.success).toBe(true);
  });
});

describe("inspectTraceCorrelationSchema", () => {
  it("acepta run_id y trace_id", () => {
    const result = inspectTraceCorrelationSchema.safeParse({
      run_id: "r1",
      trace_id: "req_abc123",
    });
    expect(result.success).toBe(true);
  });
});

describe("getDomSnapshotAtTimeSchema", () => {
  it("acepta run_id y millisecond_offset >= 0", () => {
    const result = getDomSnapshotAtTimeSchema.safeParse({
      run_id: "r1",
      millisecond_offset: 4500,
    });
    expect(result.success).toBe(true);
  });
  it("rechaza millisecond_offset negativo", () => {
    expect(
      getDomSnapshotAtTimeSchema.safeParse({
        run_id: "r1",
        millisecond_offset: -1,
      }).success
    ).toBe(false);
  });
});
