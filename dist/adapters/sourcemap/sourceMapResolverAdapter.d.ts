import type { SourceMapResolverPort } from "../../ports/sourceMapResolver.js";
export interface SourceMapResolverAdapterOptions {
    /** Base path donde buscar .map (ej. directorio de build). */
    basePath?: string;
}
/**
 * Resuelve posiciones en bundle (compilado) a fuente original.
 * artifactPath: path al .js (se busca artifactPath + ".map" o join(basePath, artifactPath) + ".map").
 * Si no hay .map o falla, devuelve null.
 */
export declare function createSourceMapResolver(options?: SourceMapResolverAdapterOptions): SourceMapResolverPort;
//# sourceMappingURL=sourceMapResolverAdapter.d.ts.map