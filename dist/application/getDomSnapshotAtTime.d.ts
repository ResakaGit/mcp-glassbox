/**
 * Caso de uso: get_dom_snapshot_at_time.
 * Obtiene representación textual del DOM en un instante del trace (time-travel).
 */
import type { RunStorePort } from "../ports/runStore.js";
import type { TraceReaderPort } from "../ports/traceReader.js";
import type { ToolResult } from "../domain/errors.js";
export declare function getDomSnapshotAtTime(ports: {
    runStore: RunStorePort;
    traceReader: TraceReaderPort;
}, runId: string, millisecondOffset: number): Promise<ToolResult>;
//# sourceMappingURL=getDomSnapshotAtTime.d.ts.map