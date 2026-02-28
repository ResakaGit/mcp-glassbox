import Docker from "dockerode";
import { Readable } from "node:stream";
function isReadableStream(out) {
    return (out != null &&
        typeof out.on === "function" &&
        typeof out.pipe === "function");
}
function streamToLines(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", (chunk) => {
            if (Buffer.isBuffer(chunk)) {
                chunks.push(chunk);
            }
            else if (typeof chunk === "string") {
                chunks.push(Buffer.from(chunk, "utf8"));
            }
            else {
                // ignorar tipos raros; mantenemos robustez
            }
        });
        stream.on("end", () => {
            const buf = Buffer.concat(chunks);
            const text = buf.toString("utf8");
            const lines = text
                .split(/\r?\n/)
                .map((s) => s.trim())
                .filter(Boolean);
            resolve(lines);
        });
        stream.on("error", reject);
    });
}
export function createDockerodeContainerLogs(options = {}) {
    const docker = options.docker ?? new Docker();
    return {
        async getLogsSince(containerNames, sinceTimestampMs, options) {
            const sinceSeconds = Math.floor(sinceTimestampMs / 1000);
            const allLines = [];
            const traceId = options?.traceId;
            for (const name of containerNames) {
                try {
                    const container = docker.getContainer(name);
                    const out = await new Promise((resolve, reject) => {
                        container.logs({
                            since: sinceSeconds,
                            stdout: true,
                            stderr: true,
                            tail: 500,
                        }, (err, stream) => {
                            if (err)
                                reject(err);
                            else
                                resolve(stream ?? Readable.from([]));
                        });
                    });
                    let lines;
                    if (Buffer.isBuffer(out)) {
                        lines = out.toString("utf8").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
                    }
                    else if (typeof out === "string") {
                        lines = out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
                    }
                    else if (isReadableStream(out)) {
                        try {
                            lines = await streamToLines(out);
                        }
                        catch {
                            lines = [];
                        }
                    }
                    else {
                        lines = [];
                    }
                    if (traceId) {
                        lines = lines.filter((line) => line.includes(traceId));
                    }
                    if (lines.length > 0) {
                        allLines.push(`[${name}]`, ...lines);
                    }
                }
                catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    allLines.push(`[${name}] Error: ${msg}`);
                }
            }
            return allLines;
        },
    };
}
//# sourceMappingURL=dockerodeContainerLogs.js.map