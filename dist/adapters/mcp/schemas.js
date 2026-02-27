import { z } from "zod";
export const executeWithTelemetrySchema = z.object({
    sandbox_id: z.string().describe("El ID del entorno Sandbox activo."),
    entry_command: z
        .string()
        .min(1, "entry_command requerido")
        .describe("El comando de test a ejecutar (ej. 'npx playwright test auth.spec.ts')."),
    target_containers: z
        .array(z.string().min(1, "cada container name debe ser no vacío"))
        .describe("Contenedores de los que extraer logs de backend (ej. ['backend', 'db']).")
        .default([]),
});
/** V3: input para run_test_and_get_summary */
export const runTestAndGetSummarySchema = z.object({
    sandbox_id: z.string().describe("ID del entorno Sandbox."),
    entry_command: z
        .string()
        .min(1, "entry_command requerido")
        .describe("Comando de test (ej. npx playwright test)."),
    target_containers: z
        .array(z.string().min(1))
        .describe("Contenedores para logs de backend.")
        .default([]),
    source_map_base_path: z
        .string()
        .optional()
        .describe("Directorio base para resolver source maps (.map)."),
    truncate_body_chars: z
        .number()
        .optional()
        .describe("Máximo caracteres en response_body (default 500)."),
    backend_log_levels: z
        .array(z.string())
        .optional()
        .describe("Niveles a mantener en logs (ej. WARN, ERROR)."),
});
const telemetryQueryTypeSchema = z.enum([
    "network_by_status",
    "network_request_full",
    "console_errors",
    "backend_logs",
    "full_telemetry",
]);
/** V3: input para query_telemetry */
export const queryTelemetrySchema = z.object({
    run_id: z.string().min(1, "run_id requerido").describe("ID del run (de run_test_and_get_summary)."),
    query: z.object({
        type: telemetryQueryTypeSchema,
        status: z.number().optional(),
        request_url: z.string().optional(),
        truncate_body_chars: z.number().optional().describe("Máximo caracteres en response_body (default desde config)."),
        backend_log_levels: z
            .union(z.array(z.string()), z.literal("full"))
            .optional()
            .describe("Para backend_logs: 'full' = raw; array = solo esos niveles (ej. ['WARN','ERROR'])."),
    }),
});
/** V3 True: create_sandbox_savepoint */
export const createSandboxSavepointSchema = z.object({
    savepoint_name: z
        .string()
        .min(1, "savepoint_name requerido")
        .describe("Nombre del savepoint (ej. db_migrada_sin_usuarios)."),
});
/** V3 True: run_deterministic_scenario */
export const runDeterministicScenarioSchema = z.object({
    entry_command: z
        .string()
        .min(1)
        .describe("Comando de test (ej. npx playwright test)."),
    sandbox_id: z.string().describe("ID del sandbox."),
    target_containers: z.array(z.string().min(1)).default([]),
    restore_savepoint_after: z
        .boolean()
        .describe("Si true, restaura el sandbox al savepoint_name al terminar."),
    savepoint_name: z
        .string()
        .optional()
        .describe("Requerido cuando restore_savepoint_after es true."),
    source_map_base_path: z.string().optional(),
    truncate_body_chars: z.number().optional(),
    backend_log_levels: z.array(z.string()).optional(),
});
/** V3 True: inspect_trace_correlation */
export const inspectTraceCorrelationSchema = z.object({
    run_id: z.string().min(1).describe("ID del run."),
    trace_id: z.string().min(1).describe("Trace-ID para filtrar logs del backend."),
});
/** V3 True: get_dom_snapshot_at_time */
export const getDomSnapshotAtTimeSchema = z.object({
    run_id: z.string().min(1).describe("ID del run (con trace grabado)."),
    millisecond_offset: z
        .number()
        .min(0)
        .describe("Milisegundos desde el inicio del trace."),
});
//# sourceMappingURL=schemas.js.map