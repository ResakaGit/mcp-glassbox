/**
 * Sistema de errores para tools MCP.
 * Contrato idéntico a example-mcp para que el LLM reciba isError en el resultado.
 */
export function toolErrorResult(message) {
    return {
        content: [{ type: "text", text: message }],
        isError: true,
    };
}
export class ToolError extends Error {
    constructor(message) {
        super(message);
        this.name = "ToolError";
        Object.setPrototypeOf(this, ToolError.prototype);
    }
}
export function isToolError(value) {
    return value instanceof ToolError;
}
export function errorToToolResult(error) {
    const message = error instanceof Error ? error.message : String(error ?? "Unknown error");
    return toolErrorResult(message);
}
//# sourceMappingURL=errors.js.map