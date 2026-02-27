import Docker from "dockerode";
import type { ContainerLogsPort } from "../../ports/containerLogs.js";
export interface DockerodeContainerLogsOptions {
    docker?: Docker;
}
export declare function createDockerodeContainerLogs(options?: DockerodeContainerLogsOptions): ContainerLogsPort;
//# sourceMappingURL=dockerodeContainerLogs.d.ts.map