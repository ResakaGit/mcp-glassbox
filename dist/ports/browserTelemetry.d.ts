/**
 * Puerto: captura de telemetría del navegador mientras se ejecuta una función (ej. el proceso del test).
 * Devuelve el snapshot de telemetría y el resultado de runFn para no tener que coordinar dos llamadas.
 *
 * Cuando se usa desde executeWithTelemetry, T = ProcessRunResult (exitCode, durationMs, killed?, timedOut?).
 * maxRunMs: si runFn() no resuelve en ese tiempo, se rechaza y el browser se cierra en finally (evita leak).
 */
import type { BrowserTelemetrySnapshot } from "../domain/telemetryTypes.js";
export interface RunAndCollectOptions {
    /** Máximo tiempo de espera para runFn(); si se excede, se rechaza y se cierra el browser. 0 o ausente = sin límite. */
    maxRunMs?: number;
    /** V3 True: inyectar header X-Agent-Trace-Id en todas las requests del browser. */
    traceId?: string;
    /** V3 True: grabar trace Playwright en esta ruta (trace.zip). */
    tracePath?: string;
}
export interface BrowserTelemetryPort {
    runAndCollect<T>(runFn: () => Promise<T>, options?: RunAndCollectOptions): Promise<{
        snapshot: BrowserTelemetrySnapshot;
        runResult: T;
    }>;
}
//# sourceMappingURL=browserTelemetry.d.ts.map