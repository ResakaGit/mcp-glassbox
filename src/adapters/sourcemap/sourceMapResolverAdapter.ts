import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SourceMapConsumer } from "source-map";
import type {
  SourceMapResolverPort,
  SourceMapResolvedPosition,
} from "../../ports/sourceMapResolver.js";

export interface SourceMapResolverAdapterOptions {
  /** Base path donde buscar .map (ej. directorio de build). */
  basePath?: string;
}

/**
 * Resuelve posiciones en bundle (compilado) a fuente original.
 * artifactPath: path al .js (se busca artifactPath + ".map" o join(basePath, artifactPath) + ".map").
 * Si no hay .map o falla, devuelve null.
 */
export function createSourceMapResolver(
  options: SourceMapResolverAdapterOptions = {}
): SourceMapResolverPort {
  const { basePath = "" } = options;

  return {
    async resolve(
      artifactPath: string,
      line: number,
      column: number = 0
    ): Promise<SourceMapResolvedPosition | null> {
      const mapPath = basePath
        ? join(basePath, artifactPath + ".map")
        : artifactPath.endsWith(".map")
          ? artifactPath
          : artifactPath + ".map";

      let raw: string;
      try {
        raw = await readFile(mapPath, "utf8");
      } catch {
        return null;
      }

      let consumer: SourceMapConsumer;
      try {
        const map = JSON.parse(raw);
        consumer = new SourceMapConsumer(map);
      } catch {
        return null;
      }

      try {
        // source-map: line is 1-based, column is 0-based
        const pos = consumer.originalPositionFor({ line, column });
        if (pos.source == null) return null;
        return {
          source: pos.source,
          line: pos.line ?? line,
          column: pos.column ?? 0,
        };
      } finally {
        consumer.destroy();
      }
    },
  };
}
