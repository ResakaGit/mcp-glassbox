/**
 * Casos de uso V3: run_test_and_get_summary y query_telemetry.
 * Resumen liviano + almacén de runs + consulta bajo demanda.
 */
import { randomUUID } from "node:crypto";
import { toolErrorResult } from "../domain/errors.js";
import { filterNetworkForSummary, filterBackendLogsByLevel, truncateBody, DEFAULT_BACKEND_LOG_LEVELS, } from "../domain/filtering.js";
function statusFromRunResult(exitCode, killed, timedOut) {
    if (timedOut)
        return "TIMEOUT";
    if (killed)
        return "KILLED";
    if (exitCode === 0)
        return "OK";
    return "FAILED";
}
/** Regex para extraer archivo:línea o archivo:línea:col de mensajes de error. */
const FILE_LINE_RE = /(?:\s|^)([^\s]+\.(?:js|ts|jsx|tsx|mjs|cjs)):(\d+)(?::(\d+))?/;
async function resolveErrorLine(resolver, basePath, message) {
    if (!resolver || !basePath)
        return null;
    const match = message.match(FILE_LINE_RE);
    if (!match)
        return null;
    const [, artifactPath, lineStr, colStr] = match;
    const line = parseInt(lineStr, 10);
    const column = colStr != null ? parseInt(colStr, 10) : 0;
    const pos = await resolver.resolve(artifactPath, line, column);
    if (!pos)
        return null;
    return {
        original: message,
        source: pos.source,
        line: pos.line,
        column: pos.column,
    };
}
export async function runTestAndGetSummary(ports, input, options) {
    const startTimeMs = Date.now();
    const run_id = input.run_id ?? randomUUID();
    const truncateChars = input.truncate_body_chars ?? 500;
    const backendLevels = input.backend_log_levels ?? DEFAULT_BACKEND_LOG_LEVELS;
    let runResult;
    let browserSnapshot;
    try {
        const result = await ports.browserTelemetry.runAndCollect(() => ports.processRunner.run(input.entry_command, {
            timeoutMs: options?.timeoutMs,
        }), {
            maxRunMs: options?.timeoutMs,
            traceId: input.trace_id,
            tracePath: input.trace_path,
        });
        runResult = result.runResult;
        browserSnapshot = result.snapshot;
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return toolErrorResult(`Error al ejecutar comando: ${msg}`);
    }
    let containerLogs = [];
    const containerNames = input.target_containers.filter((n) => n.length > 0);
    if (containerNames.length > 0) {
        try {
            containerLogs = await ports.containerLogs.getLogsSince(containerNames, startTimeMs, input.trace_id ? { traceId: input.trace_id } : undefined);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            containerLogs = [`Error obteniendo logs: ${msg}`];
        }
    }
    const filteredNetwork = filterNetworkForSummary(browserSnapshot.network_failures, truncateChars);
    const filteredBackendLogs = filterBackendLogsByLevel(containerLogs, [...backendLevels]);
    const resolved_errors = [];
    const basePath = input.source_map_base_path;
    const resolver = ports.sourceMapResolver;
    for (const msg of [...browserSnapshot.console_errors, ...browserSnapshot.page_errors]) {
        const resolved = await resolveErrorLine(resolver, basePath, msg);
        if (resolved)
            resolved_errors.push(resolved);
    }
    const status = statusFromRunResult(runResult.exitCode, runResult.killed, runResult.timedOut);
    const summary = {
        run_id,
        status,
        exit_code: runResult.exitCode,
        execution_time_ms: runResult.durationMs,
        counts: {
            network_failures: filteredNetwork.length,
            console_errors: browserSnapshot.console_errors.length,
            page_errors: browserSnapshot.page_errors.length,
            backend_warn_error_lines: filteredBackendLogs.length,
        },
        accessibility_tree: browserSnapshot.accessibility_tree,
        resolved_errors: resolved_errors.length > 0 ? resolved_errors : undefined,
        network_failures: filteredNetwork,
        console_errors: browserSnapshot.console_errors,
        page_errors: browserSnapshot.page_errors,
        backend_logs: filteredBackendLogs,
    };
    const raw = {
        run_id,
        status,
        exit_code: runResult.exitCode,
        execution_time_ms: runResult.durationMs,
        browser_console_errors: browserSnapshot.console_errors,
        network_failures: browserSnapshot.network_failures,
        page_errors: browserSnapshot.page_errors,
        backend_container_logs: containerLogs,
        accessibility_tree: browserSnapshot.accessibility_tree,
        startedAtMs: startTimeMs,
        trace_id: input.trace_id,
        trace_path: input.trace_path,
    };
    ports.runStore.put(run_id, raw);
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({ run_id, summary }, null, 2),
            },
        ],
    };
}
const DEFAULT_QUERY_TRUNCATE_CHARS = 500;
function truncateNetworkBodies(items, maxChars) {
    return items.map((r) => ({
        ...r,
        response_body: truncateBody(r.response_body, maxChars),
    }));
}
export async function queryTelemetry(ports, run_id, query) {
    const result = ports.runStore.query(run_id, query);
    if (!result.ok) {
        return toolErrorResult(result.error);
    }
    let data = result.data;
    const truncateChars = query.truncate_body_chars ?? DEFAULT_QUERY_TRUNCATE_CHARS;
    if (query.type === "network_by_status" && data && typeof data === "object" && "network_failures" in data) {
        const list = data.network_failures;
        data = { network_failures: truncateNetworkBodies(list, truncateChars) };
    }
    else if (query.type === "network_request_full" && data != null) {
        const single = data;
        if (single && typeof single === "object")
            data = truncateNetworkBodies([single], truncateChars)[0];
    }
    if (query.type === "backend_logs" && query.backend_log_levels !== "full" && data && typeof data === "object" && "backend_logs" in data) {
        const logs = data.backend_logs;
        const levels = Array.isArray(query.backend_log_levels)
            ? query.backend_log_levels
            : [...DEFAULT_BACKEND_LOG_LEVELS];
        data = { backend_logs: filterBackendLogsByLevel(logs, levels) };
    }
    return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
}
//# sourceMappingURL=glassboxV3.js.map