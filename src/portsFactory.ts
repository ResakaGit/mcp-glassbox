/**
 * Factory de puertos para uso standalone o por el orquestador.
 * V3 True: savepoint y traceReader opcionales para las 4 tools nuevas.
 */
import Docker from "dockerode";
import { createNodeProcessRunner } from "./adapters/process/nodeProcessRunner.js";
import { createDockerodeContainerLogs } from "./adapters/docker/dockerodeContainerLogs.js";
import { createPlaywrightBrowserTelemetry } from "./adapters/playwright/playwrightBrowserTelemetry.js";
import { createInMemoryRunStore } from "./adapters/store/inMemoryRunStore.js";
import { createSourceMapResolver } from "./adapters/sourcemap/sourceMapResolverAdapter.js";
import { createDockerSavepointAdapter } from "./adapters/docker/dockerSavepointAdapter.js";
import { createPlaywrightTraceReaderAdapter } from "./adapters/playwright/playwrightTraceReaderAdapter.js";
import type { GlassboxPorts } from "./application/executeWithTelemetry.js";
import type { GlassboxPortsV3 } from "./application/glassboxV3.js";
import type { RunDeterministicScenarioPorts } from "./application/runDeterministicScenario.js";
import { getConfig } from "./config.js";

export type { GlassboxPorts, GlassboxPortsV3 };

export function createGlassboxPorts(docker?: Docker): GlassboxPorts {
  const config = getConfig();
  const dockerInstance = docker ?? new Docker();
  return {
    processRunner: createNodeProcessRunner(config.EXECUTE_TIMEOUT_MS),
    containerLogs: createDockerodeContainerLogs({ docker: dockerInstance }),
    browserTelemetry: createPlaywrightBrowserTelemetry(),
  };
}

/** Crea puertos V3 (runStore + sourceMapResolver) y V3 True (savepoint, traceReader) cuando config está disponible. */
export function createGlassboxPortsV3(docker?: Docker): GlassboxPortsV3 & Partial<RunDeterministicScenarioPorts> {
  const config = getConfig();
  const dockerInstance = docker ?? new Docker();
  const base = createGlassboxPorts(dockerInstance);
  const v3: GlassboxPortsV3 & Partial<RunDeterministicScenarioPorts> = {
    ...base,
    runStore: createInMemoryRunStore(config.RUN_STORE_MAX_ENTRIES),
    sourceMapResolver: config.SOURCE_MAP_BASE_PATH
      ? createSourceMapResolver({ basePath: config.SOURCE_MAP_BASE_PATH })
      : null,
    traceReader: createPlaywrightTraceReaderAdapter(),
  };
  if (config.SAVEPOINT_CONTAINER?.trim()) {
    v3.savepoint = createDockerSavepointAdapter({
      docker: dockerInstance,
      containerName: config.SAVEPOINT_CONTAINER,
    });
  }
  return v3;
}
