import { spawn } from "node:child_process";
import treeKill from "tree-kill";
const DEFAULT_TIMEOUT_MS = 120_000;
function runProcess(command, timeoutMs) {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const child = spawn(command, {
            shell: true,
            stdio: "inherit",
        });
        const timer = timeoutMs > 0 && child.pid != null
            ? setTimeout(() => {
                treeKill(child.pid, "SIGKILL", (err) => {
                    if (err) {
                        try {
                            child.kill("SIGKILL");
                        }
                        catch {
                            // ignore
                        }
                    }
                    resolve({
                        exitCode: 137,
                        durationMs: Date.now() - start,
                        killed: true,
                        timedOut: true,
                    });
                });
            }, timeoutMs)
            : null;
        child.on("error", (err) => {
            if (timer)
                clearTimeout(timer);
            reject(err);
        });
        child.on("close", (code, signal) => {
            if (timer)
                clearTimeout(timer);
            const durationMs = Date.now() - start;
            const exitCode = code ?? (signal === "SIGKILL" ? 137 : 1);
            resolve({
                exitCode,
                durationMs,
                killed: signal != null,
            });
        });
    });
}
export function createNodeProcessRunner(defaultTimeoutMs = DEFAULT_TIMEOUT_MS) {
    return {
        async run(command, options) {
            const timeoutMs = options?.timeoutMs ?? defaultTimeoutMs;
            return runProcess(command, timeoutMs);
        },
    };
}
//# sourceMappingURL=nodeProcessRunner.js.map