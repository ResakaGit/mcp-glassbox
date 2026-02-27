import { describe, it, expect } from "vitest";
import { createPlaywrightBrowserTelemetry } from "./playwrightBrowserTelemetry.js";
describe("createPlaywrightBrowserTelemetry", () => {
    it("rechaza tras maxRunMs cuando runFn no resuelve (cierra browser en finally)", async () => {
        const port = createPlaywrightBrowserTelemetry();
        const neverResolves = () => new Promise(() => { });
        await expect(port.runAndCollect(neverResolves, { maxRunMs: 80 })).rejects.toThrow(/timeout after 80ms/);
    });
    it("devuelve snapshot y runResult cuando runFn resuelve", async () => {
        const port = createPlaywrightBrowserTelemetry();
        const result = await port.runAndCollect(() => Promise.resolve({ exitCode: 0, durationMs: 10 }));
        expect(result.runResult).toEqual({ exitCode: 0, durationMs: 10 });
        expect(result.snapshot.console_errors).toEqual([]);
        expect(result.snapshot.network_failures).toEqual([]);
        expect(result.snapshot.page_errors).toEqual([]);
        expect(typeof result.snapshot.accessibility_tree).toBe("string");
        if (result.snapshot.accessibility_tree) {
            expect(result.snapshot.accessibility_tree.length).toBeGreaterThan(0);
        }
    });
    it("resuelve cuando runFn resuelve aunque maxRunMs sea 0 (timeout interno evita leak)", async () => {
        const port = createPlaywrightBrowserTelemetry();
        const result = await port.runAndCollect(() => Promise.resolve(42), { maxRunMs: 0 });
        expect(result.runResult).toBe(42);
    });
});
//# sourceMappingURL=playwrightBrowserTelemetry.test.js.map