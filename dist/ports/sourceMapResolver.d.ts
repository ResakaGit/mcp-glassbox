/**
 * Puerto: resolución de posiciones en bundle (compilado) a fuente original vía source maps.
 * Opcional: si no hay .map o falla, devolver null (no romper el flujo).
 */
export interface SourceMapResolvedPosition {
    source: string;
    line: number;
    column: number;
}
export interface SourceMapResolverPort {
    resolve(artifactPath: string, line: number, column?: number): Promise<SourceMapResolvedPosition | null>;
}
//# sourceMappingURL=sourceMapResolver.d.ts.map