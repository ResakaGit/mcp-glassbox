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

  server.registerTool(
    "execute_with_telemetry",
    {
      description:
        "[Legacy] Ejecuta un comando de test y devuelve toda la telemetría en una respuesta. Parámetros: sandbox_id, entry_command (ej. 'npx playwright test auth.spec.ts'), target_containers (opcional, array). Preferir run_test_and_get_summary + query_telemetry (V3) para ahorro de tokens.",
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
    server.registerTool(
      "run_test_and_get_summary",
      {
        description:
          "Ejecuta el test y devuelve un resumen liviano: run_id, conteos, errores principales y árbol de accesibilidad. Parámetros: sandbox_id, entry_command, target_containers (opcional), source_map_base_path/truncate_body_chars/backend_log_levels (opcionales). Usar query_telemetry con el run_id devuelto para detalle bajo demanda.",
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

    server.registerTool(
      "query_telemetry",
      {
        description:
          "Consulta telemetría de un run ya ejecutado. Parámetros: run_id (de run_test_and_get_summary), query (tipo: network_by_status, network_request_full, console_errors, backend_logs, full_telemetry). Respuesta bajo demanda para ahorrar tokens.",
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
      server.registerTool(
        "create_sandbox_savepoint",
        {
          description:
            "Crea un savepoint del contenedor de pruebas (estado congelado) para restaurarlo después. Parámetro: savepoint_name. Requiere GLASSBOX_SAVEPOINT_CONTAINER. Útil para escenarios deterministas.",
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

      server.registerTool(
        "run_deterministic_scenario",
        {
          description:
            "Ejecuta el test en modo determinista con trace; devuelve passed, run_id, trace_id. Parámetros: sandbox_id, entry_command, target_containers (opcional), restore_savepoint_after, savepoint_name (opcional, requerido si restore_savepoint_after). Opcionales: source_map_base_path, truncate_body_chars, backend_log_levels. Permite time-travel y correlación de trazas.",
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

    server.registerTool(
      "inspect_trace_correlation",
      {
        description:
          "Devuelve una timeline fusionada para un run y trace: errores de consola, logs de backend (filtrados por trace_id) y network. Parámetros: run_id, trace_id. Útil para depurar fallos en tests E2E.",
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
      server.registerTool(
        "get_dom_snapshot_at_time",
        {
          description:
            "Obtiene el DOM textual en un instante del trace (time-travel). Parámetros: run_id (debe tener trace_path), millisecond_offset. Requiere traceReader configurado.",
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
