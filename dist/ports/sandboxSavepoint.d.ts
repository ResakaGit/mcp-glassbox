/**
 * Puerto: checkpoints del sandbox (contenedor DB u otro) para rollback tras cada prueba.
 * V3 True: createSavepoint congela estado; restoreSavepoint revierte.
 */
import type { SavepointName } from "../domain/telemetryTypes.js";
export interface SandboxSavepointPort {
    createSavepoint(name: SavepointName): Promise<void>;
    restoreSavepoint(name: SavepointName): Promise<void>;
    /** Opcional: listar nombres de savepoints existentes. */
    listSavepoints?(): Promise<string[]>;
}
//# sourceMappingURL=sandboxSavepoint.d.ts.map