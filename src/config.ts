/**
 * Configuración desde variables de entorno.
 *
 * EXECUTE_TIMEOUT_MS: tiempo máximo del proceso de test. 0 = sin timeout (no recomendado:
 * el adapter de Playwright aplica una cota interna para evitar leak de browser).
 * Valores negativos se normalizan al default. TRUNCATE_BODY_CHARS: máximo caracteres en response_body en resumen (V3).
 * RUN_STORE_MAX_ENTRIES: máximo runs en memoria para query_telemetry (V3).
 * BACKEND_LOG_LEVELS: niveles a mantener en logs (ej. WARN,ERROR); separados por coma.
 * SOURCE_MAP_BASE_PATH: directorio base para resolver .map (V3).
 * SAVEPOINT_CONTAINER: nombre del contenedor para savepoints (V3 True); si no se define, savepoints no están disponibles.
 */

const DEFAULT_EXECUTE_TIMEOUT_MS = 120_000;
const DEFAULT_TRUNCATE_BODY_CHARS = 500;
const DEFAULT_RUN_STORE_MAX_ENTRIES = 50;
const DEFAULT_BACKEND_LOG_LEVELS = "WARN,ERROR";

export function getConfig(): {
  DOCKER_HOST?: string;
  EXECUTE_TIMEOUT_MS: number;
  TRUNCATE_BODY_CHARS: number;
  RUN_STORE_MAX_ENTRIES: number;
  BACKEND_LOG_LEVELS: string[];
  SOURCE_MAP_BASE_PATH?: string;
  SAVEPOINT_CONTAINER?: string;
} {
  const raw = Number(process.env.GLASSBOX_EXECUTE_TIMEOUT_MS ?? "120000");
  const EXECUTE_TIMEOUT_MS =
    Number.isFinite(raw) && raw >= 0 ? raw : DEFAULT_EXECUTE_TIMEOUT_MS;

  const truncateRaw = Number(process.env.GLASSBOX_TRUNCATE_BODY_CHARS ?? "");
  const TRUNCATE_BODY_CHARS =
    Number.isFinite(truncateRaw) && truncateRaw > 0
      ? truncateRaw
      : DEFAULT_TRUNCATE_BODY_CHARS;

  const storeRaw = Number(process.env.GLASSBOX_RUN_STORE_MAX_ENTRIES ?? "");
  const RUN_STORE_MAX_ENTRIES =
    Number.isFinite(storeRaw) && storeRaw > 0
      ? storeRaw
      : DEFAULT_RUN_STORE_MAX_ENTRIES;

  const levelsStr =
    process.env.GLASSBOX_BACKEND_LOG_LEVELS ?? DEFAULT_BACKEND_LOG_LEVELS;
  const BACKEND_LOG_LEVELS = levelsStr
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const SOURCE_MAP_BASE_PATH = process.env.GLASSBOX_SOURCE_MAP_BASE_PATH;
  const SAVEPOINT_CONTAINER = process.env.GLASSBOX_SAVEPOINT_CONTAINER;

  return {
    DOCKER_HOST: process.env.DOCKER_HOST,
    EXECUTE_TIMEOUT_MS,
    TRUNCATE_BODY_CHARS,
    RUN_STORE_MAX_ENTRIES,
    BACKEND_LOG_LEVELS,
    SOURCE_MAP_BASE_PATH,
    SAVEPOINT_CONTAINER,
  };
}
