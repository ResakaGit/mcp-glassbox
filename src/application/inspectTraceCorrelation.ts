/**
 * Caso de uso: inspect_trace_correlation.
 * Devuelve timeline fusionada: console errors + backend logs (filtrados por trace_id) + network para ese run/trace.
 */

import type { RunStorePort } from "../ports/runStore.js";
import type { ToolResult } from "../domain/errors.js";
import { toolErrorResult } from "../domain/errors.js";

export interface TraceCorrelationResult {
  run_id: string;
  trace_id: string;
  console_errors: string[];
  backend_logs: string[];
  network_failures: Array<{ url: string; method: string; status?: number; response_body?: string }>;
}

export async function inspectTraceCorrelation(
  ports: { runStore: RunStorePort },
  runId: string,
  traceId: string
): Promise<ToolResult> {
  const raw = ports.runStore.get(runId);
  if (!raw) {
    return toolErrorResult(`Run not found: ${runId}`);
  }
  const backendLogs = raw.backend_container_logs.filter((line) =>
    line.includes(traceId)
  );

  const result: TraceCorrelationResult = {
    run_id: runId,
    trace_id: traceId,
    console_errors: raw.browser_console_errors,
    backend_logs: backendLogs,
    network_failures: raw.network_failures,
  };
  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
  };
}
