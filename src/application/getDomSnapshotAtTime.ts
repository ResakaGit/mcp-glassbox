/**
 * Caso de uso: get_dom_snapshot_at_time.
 * Obtiene representación textual del DOM en un instante del trace (time-travel).
 */

import type { RunStorePort } from "../ports/runStore.js";
import type { TraceReaderPort } from "../ports/traceReader.js";
import type { ToolResult } from "../domain/errors.js";
import { toolErrorResult } from "../domain/errors.js";

export async function getDomSnapshotAtTime(
  ports: { runStore: RunStorePort; traceReader: TraceReaderPort },
  runId: string,
  millisecondOffset: number
): Promise<ToolResult> {
  const raw = ports.runStore.get(runId);
  if (!raw) {
    return toolErrorResult(`Run not found: ${runId}`);
  }
  const tracePath = raw.trace_path;
  if (!tracePath) {
    return toolErrorResult(`Run ${runId} has no trace_path (trace not recorded).`);
  }
  try {
    const snapshot = await ports.traceReader.getDomSnapshotAtTime(
      tracePath,
      millisecondOffset
    );
    if (snapshot == null) {
      return toolErrorResult(
        `No snapshot at ${millisecondOffset}ms for run ${runId}.`
      );
    }
    return {
      content: [{ type: "text", text: snapshot }],
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return toolErrorResult(`getDomSnapshotAtTime failed: ${msg}`);
  }
}
