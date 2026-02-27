/**
 * Puerto: logs de contenedores Docker desde un instante dado.
 * V3 True: opción traceId para filtrar solo líneas que contengan ese ID (backend debe loguear el Trace-ID).
 */
export interface GetLogsSinceOptions {
    /** Si se indica, el adapter filtra líneas que contengan este ID. Para correlación exacta el backend debe incluir el Trace-ID en cada línea. */
    traceId?: string;
}
export interface ContainerLogsPort {
    getLogsSince(containerNames: string[], sinceTimestampMs: number, options?: GetLogsSinceOptions): Promise<string[]>;
}
//# sourceMappingURL=containerLogs.d.ts.map