/**
 * Adapter: lee trace.zip de Playwright para getDomSnapshotAtTime.
 * Formato interno no es público; best-effort. Puede requerir actualización en upgrades de Playwright.
 */

import yauzl from "yauzl";
import { stat } from "node:fs/promises";
import type { TraceReaderPort } from "../../ports/traceReader.js";

function readZipEntry(
  zipPath: string,
  entryFileName: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (err, zip) => {
      if (err) {
        reject(err);
        return;
      }
      if (!zip) {
        reject(new Error("zip open returned no handle"));
        return;
      }
      zip.readEntry();
      zip.on("entry", (entry: yauzl.Entry) => {
        if (entry.fileName !== entryFileName) {
          zip.readEntry();
          return;
        }
        zip.openReadStream(entry, (e, stream) => {
          if (e) {
            zip.close();
            reject(e);
            return;
          }
          if (!stream) {
            zip.readEntry();
            return;
          }
          const chunks: Buffer[] = [];
          stream.on("data", (c: Buffer) => chunks.push(c));
          stream.on("end", () => {
            zip.close();
            resolve(Buffer.concat(chunks));
          });
          stream.on("error", (e) => {
            zip.close();
            reject(e);
          });
        });
      });
      zip.on("end", () => {
        reject(new Error(`Entry not found: ${entryFileName}`));
      });
    });
  });
}

/**
 * Playwright trace puede tener "trace" o "trace.trace". Eventos suelen ser por líneas (NDJSON) o binario.
 * Buscamos snapshot más cercano al offset; si no hay metadata clara, devolvemos un mensaje útil.
 */
export function createPlaywrightTraceReaderAdapter(): TraceReaderPort {
  return {
    async getDomSnapshotAtTime(
      tracePath: string,
      millisecondOffset: number
    ): Promise<string | null> {
      try {
        await stat(tracePath);
      } catch {
        return null;
      }

      let traceContent: Buffer;
      try {
        traceContent = await readZipEntry(tracePath, "trace");
      } catch {
        try {
          traceContent = await readZipEntry(tracePath, "trace.trace");
        } catch {
          return null;
        }
      }

      const text = traceContent.toString("utf8");
      const lines = text.split(/\r?\n/).filter(Boolean);
      const events: Array<{ ts?: number; snapshot?: unknown }> = [];
      for (const line of lines) {
        try {
          const obj = JSON.parse(line) as Record<string, unknown>;
          events.push(obj);
        } catch {
          // skip non-JSON lines
        }
      }

      // Playwright trace events may have timestamp in ms or ticks. Buscamos el más cercano.
      let best: string | null = null;
      let bestDelta = Number.POSITIVE_INFINITY;
      for (let i = 0; i < events.length; i++) {
        const e = events[i];
        const ts =
          typeof e.timestamp === "number"
            ? e.timestamp
            : typeof (e as { ts?: number }).ts === "number"
              ? (e as { ts: number }).ts
              : undefined;
        if (ts != null) {
          const delta = Math.abs(ts - millisecondOffset);
          if (delta < bestDelta) {
            bestDelta = delta;
            best =
              typeof e.snapshot === "string"
                ? e.snapshot
                : e.snapshot != null
                  ? JSON.stringify(e.snapshot, null, 2)
                  : `[Snapshot event at ~${ts}ms, index ${i}]`;
          }
        }
      }
      if (best != null) return best;

      // Fallback: si hay algún snapshot en los eventos, devolver el primero
      for (const e of events) {
        if (e.snapshot != null) {
          return typeof e.snapshot === "string"
            ? e.snapshot
            : JSON.stringify(e.snapshot, null, 2);
        }
      }

      return `Trace has ${events.length} events; no snapshot with timestamp found near ${millisecondOffset}ms. Open trace in Playwright trace viewer for full inspection.`;
    },
  };
}
