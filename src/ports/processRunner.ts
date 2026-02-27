/**
 * Puerto: ejecución de un comando con medición de tiempo y opcional timeout.
 */

export interface ProcessRunResult {
  exitCode: number;
  durationMs: number;
  killed?: boolean;
  /** true when the process was killed due to timeout */
  timedOut?: boolean;
}

export interface ProcessRunnerPort {
  run(
    command: string,
    options?: { timeoutMs?: number }
  ): Promise<ProcessRunResult>;
}
