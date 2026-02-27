import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GlassboxPorts } from "../../application/executeWithTelemetry.js";
import type { GlassboxPortsV3 } from "../../application/glassboxV3.js";
/**
 * Registra las tools de mcp-glassbox en un McpServer existente.
 * Con ports V3 registra también run_test_and_get_summary y query_telemetry.
 */
export declare function registerGlassboxTools(server: McpServer, ports: GlassboxPorts | GlassboxPortsV3): void;
export declare const glassboxMcpModule: {
    name: string;
    version: string;
    register: typeof registerGlassboxTools;
};
export declare function startServer(ports: GlassboxPorts | GlassboxPortsV3): Promise<void>;
//# sourceMappingURL=server.d.ts.map