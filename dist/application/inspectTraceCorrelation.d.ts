/**
 * Caso de uso: inspect_trace_correlation.
 * Devuelve timeline fusionada: console errors + backend logs (filtrados por trace_id) + network para ese run/trace.
 */
import type { RunStorePort } from "../ports/runStore.js";
import type { ToolResult } from "../domain/errors.js";
export interface TraceCorrelationResult {
    run_id: string;
    trace_id: string;
    console_errors: string[];
    backend_logs: string[];
    network_failures: Array<{
        url: string;
        method: string;
        status?: number;
        response_body?: string;
    }>;
}
export declare function inspectTraceCorrelation(ports: {
    runStore: RunStorePort;
}, runId: string, traceId: string): Promise<ToolResult>;
//# sourceMappingURL=inspectTraceCorrelation.d.ts.map