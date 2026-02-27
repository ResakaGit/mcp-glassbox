import { describe, it, expect } from "vitest";
import { executeWithTelemetry } from "./executeWithTelemetry.js";
function mockPorts(overrides) {
    return {
        processRunner: {
            run: async () => ({ exitCode: 1, durationMs: 100 }),
        },
        containerLogs: {
            getLogsSince: async () => ["[backend] Error log line"],
        },
        browserTelemetry: {
            runAndCollect: async (runFn) => {
                const runResult = await runFn();
                return {
                    runResult,
                    snapshot: {
                        console_errors: ["[error] Console error"],
                        network_failures: [
                            { url: "https://api/foo", method: "POST", status: 403, response_body: "Forbidden" },
                        ],
                        page_errors: ["Uncaught TypeError: x is undefined"],
                    },
                };
            },
        },
        ...overrides,
    };
}
describe("executeWithTelemetry", () => {
    it("devuelve ToolResult con JSON de salida y status FAILED cuando exitCode !== 0", async () => {
        const result = await executeWithTelemetry(mockPorts(), {
            sandbox_id: "sb1",
            entry_command: "echo test",
            target_containers: ["backend"],
        });
        expect(result.isError).toBeFalsy();
        expect(result.content).toHaveLength(1);
        const text = result.content[0].text;
        const output = JSON.parse(text);
        expect(output.status).toBe("FAILED");
        expect(output.exit_code).toBe(1);
        expect(output.execution_time_ms).toBe(100);
        expect(output.telemetry.browser_console_errors).toContain("[error] Console error");
        expect(output.telemetry.network_failures).toHaveLength(1);
        expect(output.telemetry.network_failures[0].status).toBe(403);
        expect(output.telemetry.page_errors).toContain("Uncaught TypeError: x is undefined");
        expect(output.telemetry.backend_container_logs).toContain("[backend] Error log line");
    });
    it("devuelve status OK cuando exitCode es 0", async () => {
        const result = await executeWithTelemetry(mockPorts({
            processRunner: { run: async () => ({ exitCode: 0, durationMs: 50 }) },
        }), {
            sandbox_id: "sb1",
            entry_command: "true",
            target_containers: [],
        });
        expect(result.isError).toBeFalsy();
        const output = JSON.parse(result.content[0].text);
        expect(output.status).toBe("OK");
        expect(output.exit_code).toBe(0);
    });
    it("devuelve toolErrorResult cuando processRunner lanza", async () => {
        const result = await executeWithTelemetry(mockPorts({
            processRunner: { run: async () => { throw new Error("spawn ENOENT"); } },
            browserTelemetry: {
                runAndCollect: async (runFn) => {
                    try {
                        const runResult = await runFn();
                        return { runResult, snapshot: { console_errors: [], network_failures: [], page_errors: [] } };
                    }
                    catch (err) {
                        throw err;
                    }
                },
            },
        }), { sandbox_id: "sb1", entry_command: "nonexistent", target_containers: [] });
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("ENOENT");
    });
    it("solo pide logs de contenedores con nombre no vacío (defensa en profundidad)", async () => {
        let capturedNames = [];
        const result = await executeWithTelemetry(mockPorts({
            containerLogs: {
                getLogsSince: async (names) => {
                    capturedNames = names;
                    return [];
                },
            },
        }), {
            sandbox_id: "sb1",
            entry_command: "true",
            target_containers: ["backend", "", "db"],
        });
        expect(result.isError).toBeFalsy();
        expect(capturedNames).toEqual(["backend", "db"]);
    });
    it("devuelve toolErrorResult cuando runAndCollect rechaza (ej. timeout)", async () => {
        const result = await executeWithTelemetry(mockPorts({
            browserTelemetry: {
                runAndCollect: async () => {
                    throw new Error("runAndCollect timeout after 100ms");
                },
            },
        }), { sandbox_id: "sb1", entry_command: "sleep 1", target_containers: [] });
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("timeout");
    });
});
//# sourceMappingURL=executeWithTelemetry.test.js.map