/**
 * Funciones puras de filtrado y truncado para V3 (token saver).
 * Sin I/O; stateless.
 */
const DEFAULT_TRUNCATE_CHARS = 500;
/**
 * Trunca un string a N caracteres; si excede, añade "…".
 */
export function truncateBody(body, maxChars = DEFAULT_TRUNCATE_CHARS) {
    if (body == null || body === "")
        return undefined;
    if (body.length <= maxChars)
        return body;
    return body.slice(0, maxChars) + "…";
}
/**
 * Filtra requests de red para el resumen: solo status >= 400 o sin respuesta (failed/pending).
 * Trunca response_body a maxBodyChars.
 */
export function filterNetworkForSummary(requests, maxBodyChars = DEFAULT_TRUNCATE_CHARS) {
    const onlyFailures = requests.filter((r) => r.status === undefined || r.status >= 400);
    return onlyFailures.map((r) => ({
        ...r,
        response_body: truncateBody(r.response_body, maxBodyChars),
    }));
}
/**
 * Niveles por defecto para filtrar logs de backend (solo WARN y ERROR).
 */
export const DEFAULT_BACKEND_LOG_LEVELS = ["WARN", "ERROR"];
/**
 * Mantiene solo las líneas que contienen alguno de los niveles (ej. "WARN", "ERROR").
 * Case-sensitive por defecto; si levels está vacío, devuelve [].
 */
export function filterBackendLogsByLevel(lines, levels = DEFAULT_BACKEND_LOG_LEVELS) {
    if (levels.length === 0)
        return [];
    return lines.filter((line) => levels.some((level) => line.includes(level)));
}
//# sourceMappingURL=filtering.js.map