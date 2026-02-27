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
export declare function getConfig(): {
    DOCKER_HOST?: string;
    EXECUTE_TIMEOUT_MS: number;
    TRUNCATE_BODY_CHARS: number;
    RUN_STORE_MAX_ENTRIES: number;
    BACKEND_LOG_LEVELS: string[];
    SOURCE_MAP_BASE_PATH?: string;
    SAVEPOINT_CONTAINER?: string;
};
//# sourceMappingURL=config.d.ts.map