/**
 * Caso de uso: inspect_trace_correlation.
 * Devuelve timeline fusionada: console errors + backend logs (filtrados por trace_id) + network para ese run/trace.
 */
import { toolErrorResult } from "../domain/errors.js";
export async function inspectTraceCorrelation(ports, runId, traceId) {
    const raw = ports.runStore.get(runId);
    if (!raw) {
        return toolErrorResult(`Run not found: ${runId}`);
    }
    const backendLogs = raw.backend_container_logs.filter((line) => line.includes(traceId));
    const result = {
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
//# sourceMappingURL=inspectTraceCorrelation.js.map