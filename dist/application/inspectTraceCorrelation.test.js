import { describe, it, expect } from "vitest";
import { inspectTraceCorrelation } from "./inspectTraceCorrelation.js";
import { createInMemoryRunStore } from "../adapters/store/inMemoryRunStore.js";
describe("inspectTraceCorrelation", () => {
    it("devuelve error si run_id no existe", async () => {
        const runStore = createInMemoryRunStore(10);
        const result = await inspectTraceCorrelation({ runStore }, "missing", "req_abc");
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("Run not found");
    });
    it("devuelve console_errors, backend_logs filtrados por trace_id, network_failures", async () => {
        const runStore = createInMemoryRunStore(10);
        const raw = {
            run_id: "r1",
            status: "FAILED",
            exit_code: 1,
            execution_time_ms: 100,
            browser_console_errors: ["[error] click failed"],
            network_failures: [{ url: "/api", method: "POST", status: 500 }],
            page_errors: [],
            backend_container_logs: [
                "req_abc [WARN] slow query",
                "req_xyz [ERROR] other",
                "req_abc [ERROR] timeout",
            ],
            startedAtMs: Date.now(),
            trace_id: "req_abc",
        };
        runStore.put("r1", raw);
        const result = await inspectTraceCorrelation({ runStore }, "r1", "req_abc");
        expect(result.isError).toBeFalsy();
        const data = JSON.parse(result.content[0].text);
        expect(data.run_id).toBe("r1");
        expect(data.trace_id).toBe("req_abc");
        expect(data.console_errors).toEqual(["[error] click failed"]);
        expect(data.backend_logs).toHaveLength(2);
        expect(data.backend_logs).toContain("req_abc [WARN] slow query");
        expect(data.backend_logs).toContain("req_abc [ERROR] timeout");
        expect(data.network_failures).toHaveLength(1);
    });
});
//# sourceMappingURL=inspectTraceCorrelation.test.js.map