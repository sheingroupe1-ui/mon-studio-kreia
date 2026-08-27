import {
  appendAudio,
  appendFrame,
  createJob,
  getJob,
  isJobType,
  JOB_MISSING,
  startJob,
  startPendingJob,
} from "./jobs";

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "x-kreia": "jobs", "cache-control": "no-store" },
  });
}

export async function handleKreiaJobsRequest(request: Request): Promise<Response> {
  const method = request.method.toUpperCase();

  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-methods": "GET, POST, OPTIONS",
        "access-control-allow-headers": "content-type",
        "x-kreia": "jobs",
      },
    });
  }

  if (method === "GET") {
    const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
    if (!id) return json({ ok: true, service: "kreia-jobs" });
    const job = getJob(id);
    if (!job) return json({ ok: false, error: JOB_MISSING }, 404);
    return json(job);
  }

  if (method !== "POST") {
    return json({ ok: false, error: "Méthode non supportée." }, 405);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Requête illisible." }, 400);
  }
  const rec = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const op = typeof rec.op === "string" ? rec.op : "run";

  if (op === "poll" || op === "status") {
    const id = typeof rec.id === "string" ? rec.id : "";
    if (!id) return json({ ok: false, error: JOB_MISSING }, 400);
    const job = getJob(id);
    if (!job) return json({ ok: false, error: JOB_MISSING }, 404);
    return json(job);
  }

  if (op === "create") {
    if (!isJobType(rec.type)) return json({ ok: false, error: "Type de tâche inconnu." }, 400);
    return json(createJob(rec.type));
  }

  if (op === "frame") {
    const id = typeof rec.id === "string" ? rec.id : "";
    const jpeg = typeof rec.jpeg === "string" ? rec.jpeg : "";
    const added = appendFrame(id, Number(rec.t), jpeg);
    if (!added.ok) return json({ ok: false, error: added.error }, added.status ?? 400);
    return json(added.snapshot);
  }

  if (op === "audio") {
    const id = typeof rec.id === "string" ? rec.id : "";
    const wav = typeof rec.wav === "string" ? rec.wav : "";
    const added = appendAudio(id, Number(rec.t), wav);
    if (!added.ok) return json({ ok: false, error: added.error }, added.status ?? 400);
    return json(added.snapshot);
  }

  if (op === "start") {
    const id = typeof rec.id === "string" ? rec.id : "";
    const started = startPendingJob(id, rec.payload);
    if ("error" in started) {
      return json({ ok: false, error: started.error }, started.status ?? 400);
    }
    console.info("[kreia:jobs] started", { id: started.snapshot.id, type: started.snapshot.type });
    if (process.env.VERCEL) {
      try {
        return json(await started.done);
      } catch (err) {
        console.error("[kreia:jobs] sync wait failed", err);
        return json({
          id: started.snapshot.id,
          type: started.snapshot.type,
          status: "error",
          error: "L'analyse n'a pas pu aboutir. Réessayez.",
        });
      }
    }
    return json(started.snapshot);
  }

  if (op === "run") {
    if (!isJobType(rec.type)) return json({ ok: false, error: "Type de tâche inconnu." }, 400);
    if (rec.payload == null || typeof rec.payload !== "object") {
      return json({ ok: false, error: "Charge utile manquante." }, 400);
    }
    const { snapshot, done } = startJob(rec.type, rec.payload);
    console.info("[kreia:jobs] run", { id: snapshot.id, type: snapshot.type });
    if (process.env.VERCEL) {
      try {
        return json(await done);
      } catch (err) {
        console.error("[kreia:jobs] sync wait failed", err);
        return json({
          id: snapshot.id,
          type: snapshot.type,
          status: "error",
          error: "L'analyse n'a pas pu aboutir. Réessayez.",
        });
      }
    }
    return json(snapshot);
  }

  return json({ ok: false, error: "Opération inconnue." }, 400);
}
