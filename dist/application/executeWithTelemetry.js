import { toolErrorResult } from "../domain/errors.js";
function statusFromRunResult(exitCode, killed, timedOut) {
    if (timedOut)
        return "TIMEOUT";
    if (killed)
        return "KILLED";
    if (exitCode === 0)
        return "OK";
    return "FAILED";
}
export async function executeWithTelemetry(ports, input, options) {
    const startTimeMs = Date.now();
    let runResult;
    let browserSnapshot;
    try {
        const result = await ports.browserTelemetry.runAndCollect(() => ports.processRunner.run(input.entry_command, {
            timeoutMs: options?.timeoutMs,
        }), { maxRunMs: options?.timeoutMs });
        runResult = result.runResult;
        browserSnapshot = result.snapshot;
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return toolErrorResult(`Error al ejecutar comando: ${msg}`);
    }
    let containerLogs = [];
    const containerNames = input.target_containers.filter((n) => n.length > 0);
    if (containerNames.length > 0) {
        try {
            containerLogs = await ports.containerLogs.getLogsSince(containerNames, startTimeMs);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            containerLogs = [`Error obteniendo logs: ${msg}`];
        }
    }
    const status = statusFromRunResult(runResult.exitCode, runResult.killed, runResult.timedOut);
    const output = {
        status,
        exit_code: runResult.exitCode,
        execution_time_ms: runResult.durationMs,
        telemetry: {
            browser_console_errors: browserSnapshot.console_errors,
            network_failures: browserSnapshot.network_failures,
            page_errors: browserSnapshot.page_errors,
            backend_container_logs: containerLogs,
        },
    };
    return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
    };
}
//# sourceMappingURL=executeWithTelemetry.js.map