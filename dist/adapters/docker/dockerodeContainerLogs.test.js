import { describe, it, expect } from "vitest";
import { Readable } from "node:stream";
import { createDockerodeContainerLogs } from "./dockerodeContainerLogs.js";
describe("createDockerodeContainerLogs", () => {
    it("devuelve líneas vacías si no hay contenedores", async () => {
        const mockDocker = {
            getContainer: () => ({
                logs: (_opts, cb) => {
                    cb(null, Readable.from([]));
                },
            }),
        };
        const logs = createDockerodeContainerLogs({ docker: mockDocker });
        const result = await logs.getLogsSince([], Date.now() - 60_000);
        expect(result).toEqual([]);
    });
    it("devuelve líneas del contenedor cuando el stream tiene datos", async () => {
        const mockDocker = {
            getContainer: () => ({
                logs: (_opts, cb) => {
                    const s = Readable.from(["line1\n", "line2\n"]);
                    cb(null, s);
                },
            }),
        };
        const logs = createDockerodeContainerLogs({ docker: mockDocker });
        const result = await logs.getLogsSince(["backend"], Date.now() - 60_000);
        expect(result).toContain("[backend]");
        expect(result.some((l) => l.includes("line1") || l === "line1")).toBe(true);
        expect(result.some((l) => l.includes("line2") || l === "line2")).toBe(true);
    });
    it("no añade líneas cuando logs devuelve tipo no esperado (defensivo)", async () => {
        const mockDocker = {
            getContainer: () => ({
                logs: (_opts, cb) => {
                    cb(null, 123);
                },
            }),
        };
        const logs = createDockerodeContainerLogs({ docker: mockDocker });
        const result = await logs.getLogsSince(["weird"], Date.now() - 60_000);
        expect(result).toEqual([]);
    });
    it("incluye mensaje de error por contenedor cuando logs falla", async () => {
        const mockDocker = {
            getContainer: () => ({
                logs: (_opts, cb) => {
                    cb(new Error("No such container"));
                },
            }),
        };
        const logs = createDockerodeContainerLogs({ docker: mockDocker });
        const result = await logs.getLogsSince(["missing"], Date.now());
        expect(result).toHaveLength(1);
        expect(result[0]).toContain("[missing]");
        expect(result[0]).toContain("Error");
    });
    it("filtra líneas por traceId cuando options.traceId está presente", async () => {
        const mockDocker = {
            getContainer: () => ({
                logs: (_opts, cb) => {
                    const s = Readable.from([
                        "req_abc123 [INFO] request started\n",
                        "req_xyz999 [WARN] other request\n",
                        "req_abc123 [ERROR] failed\n",
                    ]);
                    cb(null, s);
                },
            }),
        };
        const logs = createDockerodeContainerLogs({ docker: mockDocker });
        const result = await logs.getLogsSince(["backend"], Date.now() - 60_000, { traceId: "req_abc123" });
        expect(result).toContain("[backend]");
        expect(result.filter((l) => l.includes("req_abc123"))).toHaveLength(2);
        expect(result.some((l) => l.includes("req_xyz999"))).toBe(false);
    });
});
//# sourceMappingURL=dockerodeContainerLogs.test.js.map