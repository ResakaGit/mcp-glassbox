/**
 * Caso de uso: run_deterministic_scenario.
 * Ejecuta el test con trace_id y trace; opcionalmente restaura el sandbox al savepoint al terminar.
 */

import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { GlassboxPortsV3 } from "./glassboxV3.js";
import type { RunTestAndGetSummaryInput } from "./glassboxV3.js";
import { runTestAndGetSummary } from "./glassboxV3.js";
import type { SandboxSavepointPort } from "../ports/sandboxSavepoint.js";
import type { ToolResult } from "../domain/errors.js";
import { toolErrorResult } from "../domain/errors.js";

function generateTraceId(): string {
  return "req_" + randomUUID().replace(/-/g, "").slice(0, 8);
}

export interface RunDeterministicScenarioInput {
  entry_command: string;
  sandbox_id: string;
  target_containers: string[];
  restore_savepoint_after: boolean;
  savepoint_name?: string;
  source_map_base_path?: string;
  truncate_body_chars?: number;
  backend_log_levels?: readonly string[];
}

export interface RunDeterministicScenarioPorts extends GlassboxPortsV3 {
  savepoint?: SandboxSavepointPort | null;
}

export async function runDeterministicScenario(
  ports: RunDeterministicScenarioPorts,
  input: RunDeterministicScenarioInput,
  options?: { timeoutMs?: number }
): Promise<ToolResult> {
  const run_id = randomUUID();
  const trace_id = generateTraceId();
  const traceDir = join(tmpdir(), "glassbox", run_id);
  const trace_path = join(traceDir, "trace.zip");

  try {
    await mkdir(traceDir, { recursive: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return toolErrorResult(`Failed to create trace dir: ${msg}`);
  }

  const runInput: RunTestAndGetSummaryInput = {
    sandbox_id: input.sandbox_id,
    entry_command: input.entry_command,
    target_containers: input.target_containers,
    source_map_base_path: input.source_map_base_path,
    truncate_body_chars: input.truncate_body_chars,
    backend_log_levels: input.backend_log_levels,
    run_id,
    trace_id,
    trace_path,
  };

  await runTestAndGetSummary(ports, runInput, options);

  const raw = ports.runStore.get(run_id);
  if (!raw) {
    return toolErrorResult(
      "run_deterministic_scenario: run failed before storing (check runTestAndGetSummary error)."
    );
  }

  if (input.restore_savepoint_after && input.savepoint_name?.trim()) {
    const savepoint = ports.savepoint;
    if (!savepoint) {
      return toolErrorResult(
        "restore_savepoint_after is true but Savepoint not configured (GLASSBOX_SAVEPOINT_CONTAINER)."
      );
    }
    try {
      await savepoint.restoreSavepoint(input.savepoint_name);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return toolErrorResult(`Restore savepoint failed: ${msg}`);
    }
  }

  const passed = raw.status === "OK";
  const payload = {
    passed,
    run_id,
    trace_id,
    exit_code: raw.exit_code,
    execution_time_ms: raw.execution_time_ms,
  };
  return {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
  };
}
