import { describe, it, expect } from "vitest";
import { createNodeProcessRunner } from "./nodeProcessRunner.js";
describe("createNodeProcessRunner", () => {
    it("devuelve exitCode 0 y durationMs positivo para comando que termina bien", async () => {
        const runner = createNodeProcessRunner(60_000);
        const result = await runner.run("echo ok");
        expect(result.exitCode).toBe(0);
        expect(result.durationMs).toBeGreaterThanOrEqual(0);
        expect(result.killed).toBeFalsy();
    });
    it("devuelve exitCode distinto de 0 para comando que falla", async () => {
        const runner = createNodeProcessRunner(60_000);
        const result = await runner.run("exit 3");
        expect(result.exitCode).toBe(3);
        expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });
    it("mata el proceso y devuelve killed si supera timeoutMs", async () => {
        const runner = createNodeProcessRunner(500);
        const result = await runner.run(process.platform === "win32" ? "ping -n 10 127.0.0.1" : "sleep 10");
        expect(result.killed).toBe(true);
        expect(result.exitCode).toBe(137);
        expect(result.durationMs).toBeGreaterThanOrEqual(400);
    }, 10_000);
});
//# sourceMappingURL=nodeProcessRunner.test.js.map