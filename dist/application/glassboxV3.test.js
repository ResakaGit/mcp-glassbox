import { describe, it, expect } from "vitest";
import { runTestAndGetSummary, queryTelemetry, } from "./glassboxV3.js";
import { createInMemoryRunStore } from "../adapters/store/inMemoryRunStore.js";
function mockPortsV3(overrides) {
    const runStore = createInMemoryRunStore(10);
    return {
        processRunner: {
            run: async () => ({ exitCode: 0, durationMs: 50 }),
        },
        containerLogs: {
            getLogsSince: async () => ["[WARN] something", "[INFO] skip"],
        },
        browserTelemetry: {
            runAndCollect: async (runFn) => {
                const runResult = await runFn();
                return {
                    runResult,
                    snapshot: {
                        console_errors: ["[error] err"],
                        network_failures: [
                            {
                                url: "https://api/x",
                                method: "GET",
                                status: 403,
                                response_body: "Forbidden",
                            },
                        ],
                        page_errors: [],
                        accessibility_tree: "[button \"Login\"]",
                    },
                };
            },
        },
        runStore,
        sourceMapResolver: null,
        ...overrides,
    };
}
describe("runTestAndGetSummary", () => {
    it("devuelve run_id y summary con counts y telemetría filtrada", async () => {
        const ports = mockPortsV3();
        const result = await runTestAndGetSummary(ports, {
            sandbox_id: "sb1",
            entry_command: "npx playwright test",
            target_containers: ["backend"],
        }, { timeoutMs: 60_000 });
        expect(result.isError).toBeFalsy();
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.run_id).toBeDefined();
        expect(parsed.run_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        expect(parsed.summary.status).toBe("OK");
        expect(parsed.summary.counts.network_failures).toBe(1);
        expect(parsed.summary.counts.backend_warn_error_lines).toBe(1);
        expect(parsed.summary.backend_logs).toContain("[WARN] something");
        expect(parsed.summary.accessibility_tree).toBe("[button \"Login\"]");
    });
    it("guarda en runStore para poder consultar después", async () => {
        const ports = mockPortsV3();
        const result = await runTestAndGetSummary(ports, {
            sandbox_id: "sb1",
            entry_command: "true",
            target_containers: [],
        });
        const parsed = JSON.parse(result.content[0].text);
        const run_id = parsed.run_id;
        const get = ports.runStore.get(run_id);
        expect(get).not.toBeNull();
        expect(get.network_failures).toHaveLength(1);
    });
});
describe("queryTelemetry", () => {
    it("devuelve error si run_id no existe", async () => {
        const ports = mockPortsV3();
        const result = await queryTelemetry(ports, "missing-id", {
            type: "console_errors",
        });
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("run not found");
    });
    it("devuelve datos según query.type después de un run", async () => {
        const ports = mockPortsV3();
        const runResult = await runTestAndGetSummary(ports, {
            sandbox_id: "sb1",
            entry_command: "true",
            target_containers: [],
        });
        const run_id = JSON.parse(runResult.content[0].text).run_id;
        const q1 = await queryTelemetry(ports, run_id, {
            type: "network_by_status",
            status: 403,
        });
        expect(q1.isError).toBeFalsy();
        const data1 = JSON.parse(q1.content[0].text);
        expect(data1.network_failures).toHaveLength(1);
        expect(data1.network_failures[0].status).toBe(403);
        const q2 = await queryTelemetry(ports, run_id, {
            type: "console_errors",
        });
        expect(q2.isError).toBeFalsy();
        const data2 = JSON.parse(q2.content[0].text);
        expect(data2.console_errors).toContain("[error] err");
    });
    it("trunca response_body en network_request_full según truncate_body_chars", async () => {
        const runStore = createInMemoryRunStore(10);
        const longBody = "x".repeat(2000);
        runStore.put("run-1", {
            run_id: "run-1",
            status: "FAILED",
            exit_code: 1,
            execution_time_ms: 100,
            browser_console_errors: [],
            network_failures: [
                {
                    url: "https://api/err",
                    method: "POST",
                    status: 500,
                    response_body: longBody,
                },
            ],
            page_errors: [],
            backend_container_logs: [],
            startedAtMs: Date.now(),
        });
        const ports = mockPortsV3({ runStore });
        const result = await queryTelemetry(ports, "run-1", {
            type: "network_request_full",
            truncate_body_chars: 100,
        });
        expect(result.isError).toBeFalsy();
        const data = JSON.parse(result.content[0].text);
        expect(data.response_body).toHaveLength(101);
        expect(data.response_body).toEndWith("…");
    });
    it("filtra backend_logs por backend_log_levels cuando no es 'full'", async () => {
        const runStore = createInMemoryRunStore(10);
        runStore.put("run-2", {
            run_id: "run-2",
            status: "OK",
            exit_code: 0,
            execution_time_ms: 50,
            browser_console_errors: [],
            network_failures: [],
            page_errors: [],
            backend_container_logs: [
                "[INFO] Started",
                "[WARN] Deprecation",
                "[ERROR] Something failed",
                "[DEBUG] detail",
            ],
            startedAtMs: Date.now(),
        });
        const ports = mockPortsV3({ runStore });
        const result = await queryTelemetry(ports, "run-2", {
            type: "backend_logs",
            backend_log_levels: ["ERROR"],
        });
        expect(result.isError).toBeFalsy();
        const data = JSON.parse(result.content[0].text);
        expect(data.backend_logs).toHaveLength(1);
        expect(data.backend_logs[0]).toBe("[ERROR] Something failed");
    });
});
//# sourceMappingURL=glassboxV3.test.js.map