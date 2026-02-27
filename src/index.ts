/**
 * Entrypoint: valida Docker, crea puertos y arranca el servidor MCP.
 */
import Docker from "dockerode";
import { createGlassboxPortsV3 } from "./portsFactory.js";
import { startServer } from "./adapters/mcp/server.js";

const MCP_NAME = "mcp-glassbox";

function failValidation(title: string, cause: string, steps: string[]): never {
  const lines = [
    `[MCP: ${MCP_NAME}] Validación fallida: ${title}`,
    `Causa: ${cause}`,
    "Para corregir:",
    ...steps.map((s) => `  - ${s}`),
  ];
  console.error(lines.join("\n"));
  process.exit(1);
}

async function main(): Promise<void> {
  const docker = new Docker();
  try {
    await docker.ping();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    failValidation(
      "Docker no accesible.",
      msg,
      [
        "Asegúrate de que el daemon Docker esté en ejecución.",
        "Si usas Docker remoto, define DOCKER_HOST correctamente.",
      ]
    );
  }

  const ports = createGlassboxPortsV3(docker);
  await startServer(ports);
}

main().catch((err) => {
  console.error(`[MCP: ${MCP_NAME}]`, err);
  process.exit(1);
});
