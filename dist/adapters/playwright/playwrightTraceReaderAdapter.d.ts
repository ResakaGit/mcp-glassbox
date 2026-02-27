/**
 * Adapter: lee trace.zip de Playwright para getDomSnapshotAtTime.
 * Formato interno no es público; best-effort. Puede requerir actualización en upgrades de Playwright.
 */
import type { TraceReaderPort } from "../../ports/traceReader.js";
/**
 * Playwright trace puede tener "trace" o "trace.trace". Eventos suelen ser por líneas (NDJSON) o binario.
 * Buscamos snapshot más cercano al offset; si no hay metadata clara, devolvemos un mensaje útil.
 */
export declare function createPlaywrightTraceReaderAdapter(): TraceReaderPort;
//# sourceMappingURL=playwrightTraceReaderAdapter.d.ts.map