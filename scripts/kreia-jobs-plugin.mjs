import { Buffer } from "node:buffer";

export const KREIA_JOBS_ROUTE = "/kreia/jobs";
const BODY_LIMIT = 400_000;

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(Object.assign(new Error("payload too large"), { code: "413" }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function incomingToRequest(req) {
  const host = String(req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost:8080");
  const proto = String(
    req.headers["x-forwarded-proto"] ??
      (req.socket?.encrypted ? "https" : "http"),
  );
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item);
    } else {
      headers.set(key, value);
    }
  }
  const method = (req.method ?? "GET").toUpperCase();
  const url = `${proto}://${host}${req.url ?? KREIA_JOBS_ROUTE}`;
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return new Request(url, { method, headers });
  }
  const buf = await readBody(req, BODY_LIMIT);
  return new Request(url, {
    method,
    headers,
    body: buf,
    duplex: "half",
  });
}

export function kreiaJobsPlugin() {
  return {
    name: "kreia-jobs",
    apply: "serve",
    configureServer(server) {
      // Cache the SSR handler so create/frame/start/poll share the same in-memory job map.
      let handle = null;
      const getHandle = async () => {
        if (typeof handle === "function") return handle;
        const mod = await server.ssrLoadModule("/src/lib/kreia/jobs-http.ts");
        if (typeof mod.handleKreiaJobsRequest !== "function") {
          throw new Error("handleKreiaJobsRequest missing");
        }
        handle = mod.handleKreiaJobsRequest;
        return handle;
      };
      server.middlewares.use(async (req, res, next) => {
        const pathOnly = (req.url ?? "").split("?", 1)[0];
        if (pathOnly !== KREIA_JOBS_ROUTE) {
          next();
          return;
        }
        try {
          const request = await incomingToRequest(req);
          const fn = await getHandle();
          const response = await fn(request);
          res.statusCode = response.status;
          response.headers.forEach((value, key) => {
            res.setHeader(key, value);
          });
          const body = Buffer.from(await response.arrayBuffer());
          res.end(body);
        } catch (err) {
          console.error("[kreia:jobs] middleware failed", err);
          handle = null;
          if (!res.headersSent) {
            const tooLarge = err?.code === "413" || /payload too large/i.test(String(err?.message ?? ""));
            res.statusCode = tooLarge ? 413 : 500;
            res.setHeader("content-type", "application/json; charset=utf-8");
            res.setHeader("x-kreia", "jobs");
            res.end(
              JSON.stringify({
                ok: false,
                error: tooLarge
                  ? "payload too large"
                  : "L'analyse n'a pas pu aboutir. Réessayez.",
              }),
            );
          }
        }
      });
    },
  };
}
