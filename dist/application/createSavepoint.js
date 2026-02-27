/**
 * Caso de uso: create_sandbox_savepoint.
 * Congela el estado del contenedor configurado para poder restaurarlo después.
 */
import { toolErrorResult } from "../domain/errors.js";
export async function createSavepoint(ports, savepointName) {
    try {
        await ports.savepoint.createSavepoint(savepointName);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        ok: true,
                        message: `Savepoint "${savepointName}" created.`,
                    }),
                },
            ],
        };
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return toolErrorResult(`createSavepoint failed: ${msg}`);
    }
}
//# sourceMappingURL=createSavepoint.js.map