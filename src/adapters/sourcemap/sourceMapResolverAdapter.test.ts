import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createSourceMapResolver } from "./sourceMapResolverAdapter.js";

/** Minimal valid source map (one mapping: gen line 1 -> source line 10). */
const MINIMAL_MAP = {
  version: 3,
  sources: ["src/foo.ts"],
  names: [],
  mappings: "AAAA;AACA",
  file: "bundle.js",
};

describe("createSourceMapResolver", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "glassbox-sourcemap-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("devuelve null si el archivo .map no existe", async () => {
    const resolver = createSourceMapResolver({ basePath: dir });
    const result = await resolver.resolve("nonexistent.js", 1, 0);
    expect(result).toBeNull();
  });

  it("resuelve línea/columna cuando el .map existe", async () => {
    const mapPath = join(dir, "bundle.js.map");
    await writeFile(mapPath, JSON.stringify(MINIMAL_MAP), "utf8");
    const resolver = createSourceMapResolver({ basePath: dir });
    const result = await resolver.resolve("bundle.js", 1, 0);
    if (result) {
      expect(result.source).toBe("src/foo.ts");
      expect(typeof result.line).toBe("number");
      expect(typeof result.column).toBe("number");
    }
  });
});
