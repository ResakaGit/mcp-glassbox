/**
 * Caso de uso: run_deterministic_scenario.
 * Ejecuta el test con trace_id y trace; opcionalmente restaura el sandbox al savepoint al terminar.
 */
import type { GlassboxPortsV3 } from "./glassboxV3.js";
import type { SandboxSavepointPort } from "../ports/sandboxSavepoint.js";
import type { ToolResult } from "../domain/errors.js";
export interface RunDeterministicScenarioInput {
    entry_command: string;
    sandbox_id: string;
    target_containers: string[];
    restore_savepoint_after: boolean;
    savepoint_name?: string;
    source_map_base_path?: string;
    truncate_body_chars?: number;
    backend_log_levels?: readonly string[];
}
export interface RunDeterministicScenarioPorts extends GlassboxPortsV3 {
    savepoint?: SandboxSavepointPort | null;
}
export declare function runDeterministicScenario(ports: RunDeterministicScenarioPorts, input: RunDeterministicScenarioInput, options?: {
    timeoutMs?: number;
}): Promise<ToolResult>;
//# sourceMappingURL=runDeterministicScenario.d.ts.map