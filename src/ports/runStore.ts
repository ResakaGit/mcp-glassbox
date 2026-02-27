/**
 * Puerto: almacén de runs para consulta posterior (V3).
 * Acotado (ej. máx. 50 runs); evicción FIFO.
 */

import type { RawRunTelemetry } from "../domain/telemetryTypes.js";
import type { TelemetryQuery, QueryResult } from "../domain/telemetryTypes.js";

export interface RunStorePort {
  put(runId: string, data: RawRunTelemetry): void;
  get(runId: string): RawRunTelemetry | null;
  query(runId: string, query: TelemetryQuery): QueryResult;
}
