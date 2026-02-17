// @vitest-environment node

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { apiFetch } from "../utils/apiFetch.js";

const TMP_DIR = path.join(process.cwd(), "src/tests/.tmp");
const DB_PATH = path.join(TMP_DIR, "db.json");
let server;
let port;
let baseUrl;

const waitForServer = async (url) => {
  const attempts = 40;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error("JSON server did not start in time.");
};

const findFreePort = () =>
  new Promise((resolve, reject) => {
    const socket = createServer();
    socket.listen(0, "127.0.0.1", () => {
      const address = socket.address();
      socket.close(() => resolve(address.port));
    });
    socket.on("error", reject);
  });

beforeAll(async () => {
  mkdirSync(TMP_DIR, { recursive: true });
  writeFileSync(
    DB_PATH,
    JSON.stringify({ posts: [{ id: "1", title: "Seed", content: "Init" }] }, null, 2)
  );

  port = await findFreePort();
  baseUrl = `http://127.0.0.1:${port}`;

  server = spawn(process.execPath, [path.join(process.cwd(), "src/Caching/server.js")], {
    env: {
      ...process.env,
      PORT: String(port),
      HOST: "127.0.0.1",
      DB_FILE: DB_PATH,
    },
    stdio: "ignore",
  });

  await waitForServer(`${baseUrl}/posts`);
});

afterAll(() => {
  if (server) server.kill();
  rmSync(TMP_DIR, { recursive: true, force: true });
});

describe("json-server integration", () => {
  it("creates, reads, and deletes posts via apiFetch", async () => {
    const initial = await apiFetch(`${baseUrl}/posts`);
    expect(initial).toHaveLength(1);

    const created = await apiFetch(`${baseUrl}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New", content: "Post" }),
    });
    expect(created.id).toBeDefined();

    const afterCreate = await apiFetch(`${baseUrl}/posts`);
    expect(afterCreate).toHaveLength(2);

    await apiFetch(`${baseUrl}/posts/${created.id}`, { method: "DELETE" });

    const afterDelete = await apiFetch(`${baseUrl}/posts`);
    expect(afterDelete.find((post) => post.id === created.id)).toBeUndefined();
  });
});
