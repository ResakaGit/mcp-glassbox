/**
 * Sistema de errores para tools MCP.
 * Contrato idéntico a example-mcp para que el LLM reciba isError en el resultado.
 */
export type ToolSuccessResult = {
    content: Array<{
        type: "text";
        text: string;
    }>;
    isError?: false;
};
export type ToolErrorResult = {
    content: Array<{
        type: "text";
        text: string;
    }>;
    isError: true;
};
export type ToolResult = ToolSuccessResult | ToolErrorResult;
export declare function toolErrorResult(message: string): ToolErrorResult;
export declare class ToolError extends Error {
    constructor(message: string);
}
export declare function isToolError(value: unknown): value is ToolError;
export declare function errorToToolResult(error: unknown): ToolErrorResult;
//# sourceMappingURL=errors.d.ts.map