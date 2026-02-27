/**
 * Puerto: captura de telemetría del navegador mientras se ejecuta una función (ej. el proceso del test).
 * Devuelve el snapshot de telemetría y el resultado de runFn para no tener que coordinar dos llamadas.
 *
 * Cuando se usa desde executeWithTelemetry, T = ProcessRunResult (exitCode, durationMs, killed?, timedOut?).
 * maxRunMs: si runFn() no resuelve en ese tiempo, se rechaza y el browser se cierra en finally (evita leak).
 */
export {};
//# sourceMappingURL=browserTelemetry.js.map