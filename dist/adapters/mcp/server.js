import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { errorToToolResult, toolErrorResult, } from "../../domain/errors.js";
import { executeWithTelemetry } from "../../application/executeWithTelemetry.js";
import { runTestAndGetSummary, queryTelemetry, } from "../../application/glassboxV3.js";
import { createSavepoint } from "../../application/createSavepoint.js";
import { runDeterministicScenario } from "../../application/runDeterministicScenario.js";
import { inspectTraceCorrelation } from "../../application/inspectTraceCorrelation.js";
import { getDomSnapshotAtTime } from "../../application/getDomSnapshotAtTime.js";
import * as schemas from "./schemas.js";
import { getConfig } from "../../config.js";
function zodErrorToOneLine(error) {
    const messages = error.issues.map((i) => i.message).filter(Boolean);
    return messages.length > 0 ? messages.join("; ") : error.message;
}
function parseArgs(schema, args) {
    const parsed = schema.safeParse(args);
    if (parsed.success)
        return { ok: true, data: parsed.data };
    return { ok: false, error: toolErrorResult(zodErrorToOneLine(parsed.error)) };
}
function wrapToolHandler(handler) {
    return async (args) => {
        try {
            return await handler(args);
        }
        catch (error) {
            return errorToToolResult(error);
        }
    };
}
/**
 * Registra las tools de mcp-glassbox en un McpServer existente.
 * Con ports V3 registra también run_test_and_get_summary y query_telemetry.
 */
export function registerGlassboxTools(server, ports) {
    const config = getConfig();
    server.registerTool("execute_with_telemetry", {
        description: "[Legacy] Ejecuta un comando de test y devuelve telemetría completa. Preferir run_test_and_get_summary + query_telemetry (V3) para ahorro de tokens.",
        inputSchema: schemas.executeWithTelemetrySchema,
    }, wrapToolHandler(async (args) => {
        const parsed = parseArgs(schemas.executeWithTelemetrySchema, args);
        if (!parsed.ok)
            return parsed.error;
        return executeWithTelemetry(ports, parsed.data, {
            timeoutMs: config.EXECUTE_TIMEOUT_MS,
        });
    }));
    if ("runStore" in ports && ports.runStore) {
        const v3Ports = ports;
        server.registerTool("run_test_and_get_summary", {
            description: "V3: Ejecuta el test y devuelve un resumen liviano (run_id, counts, errores filtrados, árbol de accesibilidad). Usar query_telemetry con run_id para detalle bajo demanda.",
            inputSchema: schemas.runTestAndGetSummarySchema,
        }, wrapToolHandler(async (args) => {
            const parsed = parseArgs(schemas.runTestAndGetSummarySchema, args);
            if (!parsed.ok)
                return parsed.error;
            const input = {
                ...parsed.data,
                truncate_body_chars: parsed.data.truncate_body_chars ?? config.TRUNCATE_BODY_CHARS,
                backend_log_levels: parsed.data.backend_log_levels ?? config.BACKEND_LOG_LEVELS,
            };
            return runTestAndGetSummary(v3Ports, input, {
                timeoutMs: config.EXECUTE_TIMEOUT_MS,
            });
        }));
        server.registerTool("query_telemetry", {
            description: "V3: Consulta telemetría de un run por run_id. Tipos: network_by_status, network_request_full, console_errors, backend_logs, full_telemetry.",
            inputSchema: schemas.queryTelemetrySchema,
        }, wrapToolHandler(async (args) => {
            const parsed = parseArgs(schemas.queryTelemetrySchema, args);
            if (!parsed.ok)
                return parsed.error;
            const query = {
                ...parsed.data.query,
                truncate_body_chars: parsed.data.query.truncate_body_chars ?? config.TRUNCATE_BODY_CHARS,
            };
            return queryTelemetry(v3Ports, parsed.data.run_id, query);
        }));
        const fullPorts = ports;
        if (fullPorts.savepoint) {
            server.registerTool("create_sandbox_savepoint", {
                description: "V3 True: Congela el estado del contenedor (savepoint) para restaurarlo después. Requiere GLASSBOX_SAVEPOINT_CONTAINER.",
                inputSchema: schemas.createSandboxSavepointSchema,
            }, wrapToolHandler(async (args) => {
                const parsed = parseArgs(schemas.createSandboxSavepointSchema, args);
                if (!parsed.ok)
                    return parsed.error;
                return createSavepoint({ savepoint: fullPorts.savepoint }, parsed.data.savepoint_name);
            }));
            server.registerTool("run_deterministic_scenario", {
                description: "V3 True: Ejecuta el test con trace_id y trace; devuelve passed, run_id, trace_id. Si restore_savepoint_after, restaura el sandbox al savepoint_name.",
                inputSchema: schemas.runDeterministicScenarioSchema,
            }, wrapToolHandler(async (args) => {
                const parsed = parseArgs(schemas.runDeterministicScenarioSchema, args);
                if (!parsed.ok)
                    return parsed.error;
                const input = {
                    ...parsed.data,
                    truncate_body_chars: parsed.data.truncate_body_chars ?? config.TRUNCATE_BODY_CHARS,
                    backend_log_levels: parsed.data.backend_log_levels ?? config.BACKEND_LOG_LEVELS,
                };
                return runDeterministicScenario(fullPorts, input, {
                    timeoutMs: config.EXECUTE_TIMEOUT_MS,
                });
            }));
        }
        server.registerTool("inspect_trace_correlation", {
            description: "V3 True: Timeline fusionada para run_id y trace_id: console errors, backend logs (filtrados por trace_id), network.",
            inputSchema: schemas.inspectTraceCorrelationSchema,
        }, wrapToolHandler(async (args) => {
            const parsed = parseArgs(schemas.inspectTraceCorrelationSchema, args);
            if (!parsed.ok)
                return parsed.error;
            return inspectTraceCorrelation({ runStore: v3Ports.runStore }, parsed.data.run_id, parsed.data.trace_id);
        }));
        if (fullPorts.traceReader) {
            server.registerTool("get_dom_snapshot_at_time", {
                description: "V3 True: DOM textual en un instante del trace (time-travel). run_id debe tener trace_path.",
                inputSchema: schemas.getDomSnapshotAtTimeSchema,
            }, wrapToolHandler(async (args) => {
                const parsed = parseArgs(schemas.getDomSnapshotAtTimeSchema, args);
                if (!parsed.ok)
                    return parsed.error;
                return getDomSnapshotAtTime({ runStore: v3Ports.runStore, traceReader: fullPorts.traceReader }, parsed.data.run_id, parsed.data.millisecond_offset);
            }));
        }
    }
}
const GLASSBOX_VERSION = "3.0.0";
export const glassboxMcpModule = {
    name: "mcp-glassbox",
    version: GLASSBOX_VERSION,
    register: registerGlassboxTools,
};
export async function startServer(ports) {
    const server = new McpServer({ name: glassboxMcpModule.name, version: glassboxMcpModule.version }, { capabilities: { tools: { listChanged: false } } });
    registerGlassboxTools(server, ports);
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
//# sourceMappingURL=server.js.map