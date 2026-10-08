import { spawn } from "node:child_process";
import { createConnection } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function canConnect(port = 5432) {
  return new Promise((resolve) => {
    const socket = createConnection({ host: "127.0.0.1", port }, () => {
      socket.end();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
    socket.setTimeout(800, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function waitForPg(timeoutMs = 40000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await canConnect()) return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

async function main() {
  if (await canConnect()) {
    console.log("PostgreSQL already listening on 5432");
    return;
  }

  const child = spawn(process.execPath, [path.join(root, "scripts/pg-daemon.mjs")], {
    cwd: root,
    detached: true,
    stdio: "ignore",
  });
  child.unref();

  if (await waitForPg()) {
    console.log("Embedded PostgreSQL started");
    return;
  }

  const docker = spawn("docker", ["compose", "up", "-d", "postgres"], { cwd: root, stdio: "inherit" });
  await new Promise((resolve, reject) => {
    docker.on("exit", (code) => (code === 0 ? resolve() : reject(new Error("Could not start PostgreSQL"))));
    docker.on("error", reject);
  });
  if (!(await waitForPg())) {
    throw new Error("PostgreSQL did not become ready on port 5432");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
