/**
 * Tipos de salida de execute_with_telemetry (V1) y V3 (run_test_and_get_summary / query_telemetry).
 * V3 True: trace_id para correlación, trace_path para time-travel, SavepointName para checkpoints.
 */

/** Identificador único por run para correlacionar requests del browser con logs del backend. */
export type TraceId = string;

/** Nombre de un savepoint del sandbox (ej. "db_migrada_sin_usuarios"). */
export type SavepointName = string;

export type ExecutionStatus = "OK" | "FAILED" | "TIMEOUT" | "KILLED";

export interface NetworkFailure {
  url: string;
  method: string;
  status?: number;
  response_body?: string;
}

export interface BrowserTelemetrySnapshot {
  console_errors: string[];
  network_failures: NetworkFailure[];
  page_errors: string[];
  /** V3: árbol de accesibilidad en texto (ligero en tokens). */
  accessibility_tree?: string;
}

export interface ExecuteWithTelemetryOutput {
  status: ExecutionStatus;
  exit_code: number;
  execution_time_ms: number;
  telemetry: {
    browser_console_errors: string[];
    network_failures: NetworkFailure[];
    page_errors: string[];
    backend_container_logs: string[];
  };
}

/** V3: error de consola/página resuelto a fuente original vía source map. */
export interface ResolvedError {
  original: string;
  source: string;
  line: number;
  column?: number;
}

/** V3: resumen liviano devuelto por run_test_and_get_summary. */
export interface RunSummaryCounts {
  network_failures: number;
  console_errors: number;
  page_errors: number;
  backend_warn_error_lines: number;
}

export interface RunSummary {
  run_id: string;
  status: ExecutionStatus;
  exit_code: number;
  execution_time_ms: number;
  counts: RunSummaryCounts;
  accessibility_tree?: string;
  resolved_errors?: ResolvedError[];
  /** Telemetría ya filtrada/truncada para primer vistazo. */
  network_failures: NetworkFailure[];
  console_errors: string[];
  page_errors: string[];
  backend_logs: string[];
}

/** V3: tipo de consulta para query_telemetry. */
export type TelemetryQueryType =
  | "network_by_status"
  | "network_request_full"
  | "console_errors"
  | "backend_logs"
  | "full_telemetry";

export interface TelemetryQuery {
  type: TelemetryQueryType;
  status?: number;
  request_url?: string;
  /** Máximo caracteres en response_body al devolver datos de red (token-safe). */
  truncate_body_chars?: number;
  /** Para backend_logs: "full" = raw; array = solo líneas que contienen esos niveles (ej. ["WARN","ERROR"]). */
  backend_log_levels?: string[] | "full";
}

/** V3: resultado de query_telemetry. */
export type QueryResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string };

/** V3: telemetría completa guardada por run para consultas posteriores. */
export interface RawRunTelemetry {
  run_id: string;
  status: ExecutionStatus;
  exit_code: number;
  execution_time_ms: number;
  browser_console_errors: string[];
  network_failures: NetworkFailure[];
  page_errors: string[];
  backend_container_logs: string[];
  accessibility_tree?: string;
  /** Timestamp de inicio del run (ms) para evicción/orden. */
  startedAtMs: number;
  /** V3 True: ID para correlacionar con logs del backend (X-Agent-Trace-Id). */
  trace_id?: TraceId;
  /** V3 True: ruta al trace.zip de Playwright para get_dom_snapshot_at_time. */
  trace_path?: string;
}
