/**
 * Caso de uso: create_sandbox_savepoint.
 * Congela el estado del contenedor configurado para poder restaurarlo después.
 */
import type { SandboxSavepointPort } from "../ports/sandboxSavepoint.js";
import type { ToolResult } from "../domain/errors.js";
export declare function createSavepoint(ports: {
    savepoint: SandboxSavepointPort;
}, savepointName: string): Promise<ToolResult>;
//# sourceMappingURL=createSavepoint.d.ts.map