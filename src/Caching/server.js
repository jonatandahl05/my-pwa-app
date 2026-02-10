import { createHash } from "node:crypto";
import { createApp } from "json-server/lib/app.js";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { Observer } from "json-server/lib/observer.js";

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "localhost";
const DB_FILE = process.env.DB_FILE || "db.json";

const adapter = new JSONFile(DB_FILE);
const observer = new Observer(adapter);
const db = new Low(observer, {});
await db.read();

const app = createApp(db, { static: [] });

const cacheMiddleware = (req, res, next) => {
  if (req.method !== "GET") {
    next?.();
    return;
  }

  if (req.path === "/" || req.path.includes(".")) {
    next?.();
    return;
  }

  res.setHeader(
    "Cache-Control",
    "public, max-age=60, stale-while-revalidate=30"
  );

  const json = res.json.bind(res);
  res.json = (body) => {
    if (body === undefined) {
      return json(body);
    }

    const payload = JSON.stringify(body);
    const etag = `"${createHash("sha1").update(payload).digest("hex")}"`;
    res.setHeader("ETag", etag);

    const ifNoneMatch = req.headers["if-none-match"];
    const candidates = Array.isArray(ifNoneMatch)
      ? ifNoneMatch
      : typeof ifNoneMatch === "string"
        ? ifNoneMatch.split(",").map((tag) => tag.trim())
        : [];
    const matches = candidates.includes(etag);

    if (matches) {
      res.statusCode = 304;
      res.end();
      return;
    }

    return json(body);
  };

  next?.();
};

app.middleware.unshift({
  path: "/",
  type: "mw",
  handler: cacheMiddleware,
});

app.listen(PORT, () => {
  console.log(`JSON Server running at http://${HOST}:${PORT}`);
}, HOST);
