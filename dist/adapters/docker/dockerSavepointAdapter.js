/**
 * Adapter: savepoints vía dockerode (container stop, commit, start; restore = stop, remove, create from image).
 * Requiere GLASSBOX_SAVEPOINT_CONTAINER. docker commit no incluye volúmenes montados externos.
 */
const SAVEPOINT_IMAGE_PREFIX = "glassbox_savepoint";
function toImageTag(name) {
    const safe = name.replace(/[^a-zA-Z0-9_-]/g, "_");
    return `${SAVEPOINT_IMAGE_PREFIX}:${safe}`;
}
export function createDockerSavepointAdapter(options) {
    const { docker, containerName } = options;
    return {
        async createSavepoint(name) {
            const container = docker.getContainer(containerName);
            await container.stop({ t: 10 });
            await new Promise((resolve, reject) => {
                container.commit({ repo: SAVEPOINT_IMAGE_PREFIX, tag: name.replace(/[^a-zA-Z0-9_-]/g, "_") }, (err) => {
                    if (err)
                        reject(err);
                    else
                        resolve();
                });
            });
            await container.start();
        },
        async restoreSavepoint(name) {
            const tag = toImageTag(name);
            const container = docker.getContainer(containerName);
            await container.stop({ t: 10 });
            await container.remove({ force: true });
            const created = await docker.createContainer({
                Image: tag,
                name: containerName,
            });
            await created.start();
        },
    };
}
//# sourceMappingURL=dockerSavepointAdapter.js.map