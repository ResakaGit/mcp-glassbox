import { z } from "zod";
export declare const executeWithTelemetrySchema: z.ZodObject<{
    sandbox_id: z.ZodString;
    entry_command: z.ZodString;
    target_containers: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type ExecuteWithTelemetryInput = z.infer<typeof executeWithTelemetrySchema>;
/** V3: input para run_test_and_get_summary */
export declare const runTestAndGetSummarySchema: z.ZodObject<{
    sandbox_id: z.ZodString;
    entry_command: z.ZodString;
    target_containers: z.ZodDefault<z.ZodArray<z.ZodString>>;
    source_map_base_path: z.ZodOptional<z.ZodString>;
    truncate_body_chars: z.ZodOptional<z.ZodNumber>;
    backend_log_levels: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type RunTestAndGetSummaryInput = z.infer<typeof runTestAndGetSummarySchema>;
/** V3: input para query_telemetry */
export declare const queryTelemetrySchema: z.ZodObject<{
    run_id: z.ZodString;
    query: z.ZodObject<{
        type: z.ZodEnum<{
            network_by_status: "network_by_status";
            network_request_full: "network_request_full";
            console_errors: "console_errors";
            backend_logs: "backend_logs";
            full_telemetry: "full_telemetry";
        }>;
        status: z.ZodOptional<z.ZodNumber>;
        request_url: z.ZodOptional<z.ZodString>;
        truncate_body_chars: z.ZodOptional<z.ZodNumber>;
        backend_log_levels: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodLiteral<"full">]>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type QueryTelemetryInput = z.infer<typeof queryTelemetrySchema>;
/** V3 True: create_sandbox_savepoint */
export declare const createSandboxSavepointSchema: z.ZodObject<{
    savepoint_name: z.ZodString;
}, z.core.$strip>;
export type CreateSandboxSavepointInput = z.infer<typeof createSandboxSavepointSchema>;
/** V3 True: run_deterministic_scenario */
export declare const runDeterministicScenarioSchema: z.ZodObject<{
    entry_command: z.ZodString;
    sandbox_id: z.ZodString;
    target_containers: z.ZodDefault<z.ZodArray<z.ZodString>>;
    restore_savepoint_after: z.ZodBoolean;
    savepoint_name: z.ZodOptional<z.ZodString>;
    source_map_base_path: z.ZodOptional<z.ZodString>;
    truncate_body_chars: z.ZodOptional<z.ZodNumber>;
    backend_log_levels: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type RunDeterministicScenarioInput = z.infer<typeof runDeterministicScenarioSchema>;
/** V3 True: inspect_trace_correlation */
export declare const inspectTraceCorrelationSchema: z.ZodObject<{
    run_id: z.ZodString;
    trace_id: z.ZodString;
}, z.core.$strip>;
export type InspectTraceCorrelationInput = z.infer<typeof inspectTraceCorrelationSchema>;
/** V3 True: get_dom_snapshot_at_time */
export declare const getDomSnapshotAtTimeSchema: z.ZodObject<{
    run_id: z.ZodString;
    millisecond_offset: z.ZodNumber;
}, z.core.$strip>;
export type GetDomSnapshotAtTimeInput = z.infer<typeof getDomSnapshotAtTimeSchema>;
//# sourceMappingURL=schemas.d.ts.map