/**
 * Factory de puertos para uso standalone o por el orquestador.
 * V3 True: savepoint y traceReader opcionales para las 4 tools nuevas.
 */
import Docker from "dockerode";
import type { GlassboxPorts } from "./application/executeWithTelemetry.js";
import type { GlassboxPortsV3 } from "./application/glassboxV3.js";
import type { RunDeterministicScenarioPorts } from "./application/runDeterministicScenario.js";
export type { GlassboxPorts, GlassboxPortsV3 };
export declare function createGlassboxPorts(docker?: Docker): GlassboxPorts;
/** Crea puertos V3 (runStore + sourceMapResolver) y V3 True (savepoint, traceReader) cuando config está disponible. */
export declare function createGlassboxPortsV3(docker?: Docker): GlassboxPortsV3 & Partial<RunDeterministicScenarioPorts>;
//# sourceMappingURL=portsFactory.d.ts.map