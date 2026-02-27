/**
 * Casos de uso V3: run_test_and_get_summary y query_telemetry.
 * Resumen liviano + almacén de runs + consulta bajo demanda.
 */
import type { ProcessRunnerPort } from "../ports/processRunner.js";
import type { ContainerLogsPort } from "../ports/containerLogs.js";
import type { BrowserTelemetryPort } from "../ports/browserTelemetry.js";
import type { RunStorePort } from "../ports/runStore.js";
import type { SourceMapResolverPort } from "../ports/sourceMapResolver.js";
import type { ToolResult } from "../domain/errors.js";
import type { TelemetryQuery } from "../domain/telemetryTypes.js";
export interface RunTestAndGetSummaryInput {
    sandbox_id: string;
    entry_command: string;
    target_containers: string[];
    source_map_base_path?: string;
    truncate_body_chars?: number;
    backend_log_levels?: readonly string[];
    /** V3 True: inyectar en browser y correlacionar logs. */
    trace_id?: string;
    /** V3 True: ruta donde grabar trace.zip. */
    trace_path?: string;
    /** V3 True: cuando lo provee runDeterministicScenario. */
    run_id?: string;
}
export interface GlassboxPortsV3 {
    processRunner: ProcessRunnerPort;
    containerLogs: ContainerLogsPort;
    browserTelemetry: BrowserTelemetryPort;
    runStore: RunStorePort;
    sourceMapResolver?: SourceMapResolverPort | null;
}
export declare function runTestAndGetSummary(ports: GlassboxPortsV3, input: RunTestAndGetSummaryInput, options?: {
    timeoutMs?: number;
}): Promise<ToolResult>;
export declare function queryTelemetry(ports: Pick<GlassboxPortsV3, "runStore">, run_id: string, query: TelemetryQuery): Promise<ToolResult>;
//# sourceMappingURL=glassboxV3.d.ts.map