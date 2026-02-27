/**
 * Funciones puras de filtrado y truncado para V3 (token saver).
 * Sin I/O; stateless.
 */
import type { NetworkFailure } from "./telemetryTypes.js";
/**
 * Trunca un string a N caracteres; si excede, añade "…".
 */
export declare function truncateBody(body: string | undefined, maxChars?: number): string | undefined;
/**
 * Filtra requests de red para el resumen: solo status >= 400 o sin respuesta (failed/pending).
 * Trunca response_body a maxBodyChars.
 */
export declare function filterNetworkForSummary(requests: NetworkFailure[], maxBodyChars?: number): NetworkFailure[];
/**
 * Niveles por defecto para filtrar logs de backend (solo WARN y ERROR).
 */
export declare const DEFAULT_BACKEND_LOG_LEVELS: readonly ["WARN", "ERROR"];
/**
 * Mantiene solo las líneas que contienen alguno de los niveles (ej. "WARN", "ERROR").
 * Case-sensitive por defecto; si levels está vacío, devuelve [].
 */
export declare function filterBackendLogsByLevel(lines: string[], levels?: readonly string[]): string[];
//# sourceMappingURL=filtering.d.ts.map