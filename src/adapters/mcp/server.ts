import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  errorToToolResult,
  toolErrorResult,
  type ToolErrorResult,
  type ToolResult,
} from "../../domain/errors.js";
import type { GlassboxPorts } from "../../application/executeWithTelemetry.js";
import { executeWithTelemetry } from "../../application/executeWithTelemetry.js";
import type { GlassboxPortsV3 } from "../../application/glassboxV3.js";
import {
  runTestAndGetSummary,
  queryTelemetry,
} from "../../application/glassboxV3.js";
import { createSavepoint } from "../../application/createSavepoint.js";
import { runDeterministicScenario } from "../../application/runDeterministicScenario.js";
import type { RunDeterministicScenarioPorts } from "../../application/runDeterministicScenario.js";
import { inspectTraceCorrelation } from "../../application/inspectTraceCorrelation.js";
import { getDomSnapshotAtTime } from "../../application/getDomSnapshotAtTime.js";
import type { TraceReaderPort } from "../../ports/traceReader.js";
import * as schemas from "./schemas.js";
import { getConfig } from "../../config.js";

function zodErrorToOneLine(error: z.ZodError): string {
  const messages = error.issues.map((i: z.ZodIssue) => i.message).filter(Boolean);
  return messages.length > 0 ? messages.join("; ") : error.message;
}

function parseArgs<T>(
  schema: z.ZodType<T>,
  args: unknown
): { ok: true; data: T } | { ok: false; error: ToolErrorResult } {
  const parsed = schema.safeParse(args);
  if (parsed.success) return { ok: true, data: parsed.data };
  return { ok: false, error: toolErrorResult(zodErrorToOneLine(parsed.error)) };
}

const DESCRIPTION_DOC = "TOOL_DESCRIPTION_CONVENTION.md";

function requireToolDescription(
  name: string,
  config: { description?: string; inputSchema: unknown }
): void {
  if (typeof config.description !== "string" || !config.description.trim()) {
    throw new Error(`Tool ${name}: description is required (${DESCRIPTION_DOC}).`);
  }
}

function wrapToolHandler<TArgs, TResult extends ToolResult>(
  handler: (args: TArgs) => TResult | Promise<TResult>
) {
  return async (args: TArgs): Promise<TResult> => {
    try {
      return await handler(args);
    } catch (error: unknown) {
      return errorToToolResult(error) as unknown as TResult;
    }
  };
}

/**
 * Registra las tools de mcp-glassbox en un McpServer existente.
 * Con ports V3 registra también run_test_and_get_summary y query_telemetry.
 */
export function registerGlassboxTools(
  server: McpServer,
  ports: GlassboxPorts | GlassboxPortsV3
): void {
  const config = getConfig();
  function reg(name: string, cfg: { description: string; inputSchema: unknown }, handler: (args: unknown) => Promise<ToolResult>): void {
    requireToolDescription(name, cfg);
    server.registerTool(name, cfg as Parameters<McpServer["registerTool"]>[1], handler);
  }
  reg(
    "execute_with_telemetry",
    {
      description:
        "[Legacy] Runs a test command and returns full telemetry in one response. Args: sandbox_id, entry_command (e.g. 'npx playwright test auth.spec.ts'), target_containers (optional, array). Prefer run_test_and_get_summary + query_telemetry for token savings.",
      inputSchema: schemas.executeWithTelemetrySchema,
    },
    wrapToolHandler(async (args: unknown) => {
      const parsed = parseArgs(schemas.executeWithTelemetrySchema, args);
      if (!parsed.ok) return parsed.error;
      return executeWithTelemetry(ports, parsed.data, {
        timeoutMs: config.EXECUTE_TIMEOUT_MS,
      });
    })
  );

  if ("runStore" in ports && ports.runStore) {
    const v3Ports = ports as GlassboxPortsV3;
    reg(
      "run_test_and_get_summary",
      {
        description:
          "Runs the test and returns a light summary: run_id, counts, main errors, accessibility tree. Args: sandbox_id, entry_command, target_containers (optional), source_map_base_path/truncate_body_chars/backend_log_levels (optional). Call query_telemetry with the returned run_id for on-demand detail.",
        inputSchema: schemas.runTestAndGetSummarySchema,
      },
      wrapToolHandler(async (args: unknown) => {
        const parsed = parseArgs(schemas.runTestAndGetSummarySchema, args);
        if (!parsed.ok) return parsed.error;
        const input = {
          ...parsed.data,
          truncate_body_chars: parsed.data.truncate_body_chars ?? config.TRUNCATE_BODY_CHARS,
          backend_log_levels: parsed.data.backend_log_levels ?? config.BACKEND_LOG_LEVELS,
        };
        return runTestAndGetSummary(v3Ports, input, {
          timeoutMs: config.EXECUTE_TIMEOUT_MS,
        });
      })
    );

    reg(
      "query_telemetry",
      {
        description:
          "Queries telemetry for an existing run. Args: run_id (from run_test_and_get_summary), query.type (network_by_status | network_request_full | console_errors | backend_logs | full_telemetry), query.status/request_url/truncate_body_chars/backend_log_levels (optional per type). Use for on-demand detail to save tokens.",
        inputSchema: schemas.queryTelemetrySchema,
      },
      wrapToolHandler(async (args: unknown) => {
        const parsed = parseArgs(schemas.queryTelemetrySchema, args);
        if (!parsed.ok) return parsed.error;
        const query = {
          ...parsed.data.query,
          truncate_body_chars:
            parsed.data.query.truncate_body_chars ?? config.TRUNCATE_BODY_CHARS,
        };
        return queryTelemetry(v3Ports, parsed.data.run_id, query);
      })
    );

    const fullPorts = ports as RunDeterministicScenarioPorts & {
      traceReader?: TraceReaderPort | null;
    };

    if (fullPorts.savepoint) {
      reg(
        "create_sandbox_savepoint",
        {
          description:
            "Creates a savepoint of the test container (frozen state) for later restore. Args: savepoint_name (required). Requires GLASSBOX_SAVEPOINT_CONTAINER. Use for deterministic scenarios.",
          inputSchema: schemas.createSandboxSavepointSchema,
        },
        wrapToolHandler(async (args: unknown) => {
          const parsed = parseArgs(schemas.createSandboxSavepointSchema, args);
          if (!parsed.ok) return parsed.error;
          return createSavepoint(
            { savepoint: fullPorts.savepoint! },
            parsed.data.savepoint_name
          );
        })
      );

      reg(
        "run_deterministic_scenario",
        {
          description:
            "Runs the test in deterministic mode with trace; returns passed, run_id, trace_id. Args: sandbox_id, entry_command, target_containers (optional), restore_savepoint_after, savepoint_name (required if restore_savepoint_after). Optional: source_map_base_path, truncate_body_chars, backend_log_levels. Enables time-travel and trace correlation.",
          inputSchema: schemas.runDeterministicScenarioSchema,
        },
        wrapToolHandler(async (args: unknown) => {
          const parsed = parseArgs(schemas.runDeterministicScenarioSchema, args);
          if (!parsed.ok) return parsed.error;
          const input = {
            ...parsed.data,
            truncate_body_chars: parsed.data.truncate_body_chars ?? config.TRUNCATE_BODY_CHARS,
            backend_log_levels: parsed.data.backend_log_levels ?? config.BACKEND_LOG_LEVELS,
          };
          return runDeterministicScenario(fullPorts, input, {
            timeoutMs: config.EXECUTE_TIMEOUT_MS,
          });
        })
      );
    }

    reg(
      "inspect_trace_correlation",
      {
        description:
          "Returns a merged timeline for a run and trace: console errors, backend logs (filtered by trace_id), network. Args: run_id, trace_id (required). Use to debug E2E test failures.",
        inputSchema: schemas.inspectTraceCorrelationSchema,
      },
      wrapToolHandler(async (args: unknown) => {
        const parsed = parseArgs(schemas.inspectTraceCorrelationSchema, args);
        if (!parsed.ok) return parsed.error;
        return inspectTraceCorrelation(
          { runStore: v3Ports.runStore },
          parsed.data.run_id,
          parsed.data.trace_id
        );
      })
    );

    if (fullPorts.traceReader) {
      reg(
        "get_dom_snapshot_at_time",
        {
          description:
            "Returns the DOM as text at a point in the trace (time-travel). Args: run_id (must have trace_path), millisecond_offset (required). Requires traceReader.",
          inputSchema: schemas.getDomSnapshotAtTimeSchema,
        },
        wrapToolHandler(async (args: unknown) => {
          const parsed = parseArgs(schemas.getDomSnapshotAtTimeSchema, args);
          if (!parsed.ok) return parsed.error;
          return getDomSnapshotAtTime(
            { runStore: v3Ports.runStore, traceReader: fullPorts.traceReader },
            parsed.data.run_id,
            parsed.data.millisecond_offset
          );
        })
      );
    }
  }
}

const GLASSBOX_VERSION = "3.0.0";

export const glassboxMcpModule = {
  name: "mcp-glassbox",
  version: GLASSBOX_VERSION,
  register: registerGlassboxTools,
};

export async function startServer(ports: GlassboxPorts | GlassboxPortsV3): Promise<void> {
  const server = new McpServer(
    { name: glassboxMcpModule.name, version: glassboxMcpModule.version },
    { capabilities: { tools: { listChanged: false } } }
  );
  registerGlassboxTools(server, ports);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
