/**
 * Adapter: savepoints vía dockerode (container stop, commit, start; restore = stop, remove, create from image).
 * Requiere GLASSBOX_SAVEPOINT_CONTAINER. docker commit no incluye volúmenes montados externos.
 */
import Docker from "dockerode";
import type { SandboxSavepointPort } from "../../ports/sandboxSavepoint.js";
export interface DockerSavepointAdapterOptions {
    docker: Docker;
    containerName: string;
}
export declare function createDockerSavepointAdapter(options: DockerSavepointAdapterOptions): SandboxSavepointPort;
//# sourceMappingURL=dockerSavepointAdapter.d.ts.map