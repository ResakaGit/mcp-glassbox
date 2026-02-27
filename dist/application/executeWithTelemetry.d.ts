import type { ProcessRunnerPort } from "../ports/processRunner.js";
import type { ContainerLogsPort } from "../ports/containerLogs.js";
import type { BrowserTelemetryPort } from "../ports/browserTelemetry.js";
import type { ToolResult } from "../domain/errors.js";
import type { ExecuteWithTelemetryInput } from "../adapters/mcp/schemas.js";
export interface GlassboxPorts {
    processRunner: ProcessRunnerPort;
    containerLogs: ContainerLogsPort;
    browserTelemetry: BrowserTelemetryPort;
}
export declare function executeWithTelemetry(ports: GlassboxPorts, input: ExecuteWithTelemetryInput, options?: {
    timeoutMs?: number;
}): Promise<ToolResult>;
//# sourceMappingURL=executeWithTelemetry.d.ts.map