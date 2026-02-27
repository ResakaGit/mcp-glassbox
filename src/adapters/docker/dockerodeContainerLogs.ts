import Docker from "dockerode";
import { Readable } from "node:stream";
import type { ContainerLogsPort } from "../../ports/containerLogs.js";

function isReadableStream(
  out: unknown
): out is Readable {
  return (
    out != null &&
    typeof (out as Readable).on === "function" &&
    typeof (out as Readable).pipe === "function"
  );
}

function streamToLines(stream: Readable): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk: unknown) => {
      if (Buffer.isBuffer(chunk)) {
        chunks.push(chunk);
      } else if (typeof chunk === "string") {
        chunks.push(Buffer.from(chunk, "utf8"));
      } else {
        // ignorar tipos raros; mantenemos robustez
      }
    });
    stream.on("end", () => {
      const buf = Buffer.concat(chunks as Buffer[]);
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

export interface DockerodeContainerLogsOptions {
  docker?: Docker;
}

export function createDockerodeContainerLogs(
  options: DockerodeContainerLogsOptions = {}
): ContainerLogsPort {
  const docker = options.docker ?? new Docker();

  return {
    async getLogsSince(containerNames, sinceTimestampMs, options) {
      const sinceSeconds = Math.floor(sinceTimestampMs / 1000);
      const allLines: string[] = [];
      const traceId = options?.traceId;

      for (const name of containerNames) {
        try {
          const container = docker.getContainer(name);
          const out: unknown = await new Promise((resolve, reject) => {
            container.logs(
              {
                since: sinceSeconds,
                stdout: true,
                stderr: true,
                tail: 500,
              },
              (err: Error | null, stream?: unknown) => {
                if (err) reject(err);
                else resolve(stream ?? Readable.from([]));
              }
            );
          });
          let lines: string[];
          if (Buffer.isBuffer(out)) {
            lines = out.toString("utf8").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
          } else if (typeof out === "string") {
            lines = out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
          } else if (isReadableStream(out)) {
            try {
              lines = await streamToLines(out);
            } catch {
              lines = [];
            }
          } else {
            lines = [];
          }
          if (traceId) {
            lines = lines.filter((line) => line.includes(traceId));
          }
          if (lines.length > 0) {
            allLines.push(`[${name}]`, ...lines);
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          allLines.push(`[${name}] Error: ${msg}`);
        }
      }

      return allLines;
    },
  };
}
