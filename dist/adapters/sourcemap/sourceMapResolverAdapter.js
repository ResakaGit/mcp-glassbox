import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SourceMapConsumer } from "source-map";
/**
 * Resuelve posiciones en bundle (compilado) a fuente original.
 * artifactPath: path al .js (se busca artifactPath + ".map" o join(basePath, artifactPath) + ".map").
 * Si no hay .map o falla, devuelve null.
 */
export function createSourceMapResolver(options = {}) {
    const { basePath = "" } = options;
    return {
        async resolve(artifactPath, line, column = 0) {
            const mapPath = basePath
                ? join(basePath, artifactPath + ".map")
                : artifactPath.endsWith(".map")
                    ? artifactPath
                    : artifactPath + ".map";
            let raw;
            try {
                raw = await readFile(mapPath, "utf8");
            }
            catch {
                return null;
            }
            try {
                const map = JSON.parse(raw);
                let resolved = null;
                await SourceMapConsumer.with(map, null, (consumer) => {
                    // source-map: line is 1-based, column is 0-based
                    const pos = consumer.originalPositionFor({ line, column });
                    if (pos.source == null) {
                        resolved = null;
                        return;
                    }
                    resolved = {
                        source: pos.source,
                        line: pos.line ?? line,
                        column: pos.column ?? 0,
                    };
                });
                return resolved;
            }
            catch {
                return null;
            }
        },
    };
}
//# sourceMappingURL=sourceMapResolverAdapter.js.map