import type { ProcessRunnerPort, ProcessRunResult } from "../ports/processRunner.js";
import type { ContainerLogsPort } from "../ports/containerLogs.js";
import type { BrowserTelemetryPort } from "../ports/browserTelemetry.js";
import type { ToolResult } from "../domain/errors.js";
import { toolErrorResult } from "../domain/errors.js";
import type {
  ExecuteWithTelemetryOutput,
  ExecutionStatus,
} from "../domain/telemetryTypes.js";
import type { ExecuteWithTelemetryInput } from "../adapters/mcp/schemas.js";

export interface GlassboxPorts {
  processRunner: ProcessRunnerPort;
  containerLogs: ContainerLogsPort;
  browserTelemetry: BrowserTelemetryPort;
}

function statusFromRunResult(
  exitCode: number,
  killed?: boolean,
  timedOut?: boolean
): ExecutionStatus {
  if (timedOut) return "TIMEOUT";
  if (killed) return "KILLED";
  if (exitCode === 0) return "OK";
  return "FAILED";
}

export async function executeWithTelemetry(
  ports: GlassboxPorts,
  input: ExecuteWithTelemetryInput,
  options?: { timeoutMs?: number }
): Promise<ToolResult> {
  const startTimeMs = Date.now();

  let runResult: ProcessRunResult;
  let browserSnapshot: { console_errors: string[]; network_failures: Array<{ url: string; method: string; status?: number; response_body?: string }>; page_errors: string[] };

  try {
    const result = await ports.browserTelemetry.runAndCollect(
      () =>
        ports.processRunner.run(input.entry_command, {
          timeoutMs: options?.timeoutMs,
        }),
      { maxRunMs: options?.timeoutMs }
    );
    runResult = result.runResult;
    browserSnapshot = result.snapshot;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return toolErrorResult(`Error al ejecutar comando: ${msg}`);
  }

  let containerLogs: string[] = [];
  const containerNames = input.target_containers.filter((n) => n.length > 0);
  if (containerNames.length > 0) {
    try {
      containerLogs = await ports.containerLogs.getLogsSince(
        containerNames,
        startTimeMs
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      containerLogs = [`Error obteniendo logs: ${msg}`];
    }
  }

  const status = statusFromRunResult(runResult.exitCode, runResult.killed, runResult.timedOut);
  const output: ExecuteWithTelemetryOutput = {
    status,
    exit_code: runResult.exitCode,
    execution_time_ms: runResult.durationMs,
    telemetry: {
      browser_console_errors: browserSnapshot.console_errors,
      network_failures: browserSnapshot.network_failures,
      page_errors: browserSnapshot.page_errors,
      backend_container_logs: containerLogs,
    },
  };

  return {
    content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
  };
}
