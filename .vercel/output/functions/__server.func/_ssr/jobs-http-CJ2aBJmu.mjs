import { r as createId } from "./ids-ckhly8rN.mjs";
import { C as fruitHumanoidPromptBlock, M as parseCharacter, N as parseProduction, O as lockCharactersSourceNames, T as identityParagraph, b as fail, d as chat, h as emptyDialogueBible, j as parseAnalysis, n as NETWORK_MESSAGE, o as applyLinesToScenes, r as angelPromptBlock, y as extractJson } from "./cast-edit-B0U-aGNG.mjs";
import { n as progressAt } from "./analysis-stages-DZplH0Sn.mjs";
import { n as styleFromUserChoice } from "./visual-styles-BkOrGZiu.mjs";
import { a as runProductionSlice, i as runPipelineSlice, n as runReviseAnalysis, o as anatomyPromptBlock, r as runReviseProduction } from "./analyze-core-D6so5OJq.mjs";
import { a as nextIdeaPhase, i as ideaProgressAt, o as resumeIdeaPhase, r as ideaPhaseLabel, t as IDEA_PHASE_ORDER } from "./idea-stages-B8S5HdAV.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/jobs-http-CJ2aBJmu.js
var _0002_kreia_jobs_default = "create table if not exists kreia_jobs (\n  id text primary key,\n  type text not null,\n  status text not null,\n  result jsonb,\n  error text,\n  progress jsonb,\n  checkpoint jsonb,\n  payload jsonb,\n  frames jsonb not null default '[]'::jsonb,\n  audio_chunks jsonb not null default '[]'::jsonb,\n  phase text,\n  working boolean not null default false,\n  created_at bigint not null,\n  updated_at bigint not null\n);\n\ncreate index if not exists kreia_jobs_updated_at_idx on kreia_jobs (updated_at);\n";
/**
* Migration bookkeeping shared by the two appliers — `scripts/migrate.mjs`
* (deploy, `readdir`) and `src/lib/db.ts` (PGLite preview, `import.meta.glob`).
*
* Applied files are keyed by BASENAME, so the same file applies once no matter
* which directory it is globbed from. That is what makes the auth schema safe to
* copy from `migrations/auth/` into `migrations/` when an app turns sign-in on:
* a database that already has `0001_auth.sql` will not re-run it.
*
* Neither applier descends into subdirectories, so `migrations/auth/*.sql` is
* out of scope for both until it is copied up.
*/
/**
* The `_migrations` key for a migration path (or bare filename).
* @param {string} path
* @returns {string}
*/
function migrationName(path) {
	return path.split("/").pop() ?? path;
}
/**
* @param {string} path
* @returns {boolean}
*/
function isMigrationFile(path) {
	return path.endsWith(".sql");
}
/**
* Migrations in `paths` that are not yet in `applied`, in apply order.
* Non-`.sql` entries (a `readdir` also yields `migrations/auth/`) are dropped.
* @param {Iterable<string>} paths
* @param {Iterable<string>} applied
* @returns {Array<{ name: string, path: string }>}
*/
function pendingMigrations(paths, applied) {
	const done = new Set(applied);
	return [...paths].filter(isMigrationFile).map((path) => ({
		name: migrationName(path),
		path
	})).sort((a, b) => a.name.localeCompare(b.name)).filter(({ name }) => !done.has(name));
}
var rawDatabaseUrl = typeof process !== "undefined" ? process.env.DATABASE_URL : void 0;
var databaseUrl = rawDatabaseUrl && rawDatabaseUrl.trim() ? rawDatabaseUrl : void 0;
/**
* Active backend: real **Neon** when `DATABASE_URL` is set (deployed / configured
* sandbox), otherwise a local embedded **PGLite** (Postgres compiled to WASM) so
* the app has a working database even with nothing configured — the live preview
* included. Swap in Neon later by just setting `DATABASE_URL`; no code changes.
*/
var dbSource = databaseUrl ? "neon" : "pglite";
/**
* Init state lives on globalThis as promises: dev HMR creates new instances of
* this module, and two instances racing module-level state would open a second
* pool or run two concurrent PGLite migration passes (whose duplicate
* `_migrations` insert rejects — and would get memoized, poisoning every later
* `getSql()`). A failed init clears its slot so the next call retries.
*/
var globalRef = globalThis;
/**
* Result-type parity: Postgres sends every value as text plus a type OID — the
* JS value is the DRIVER's parsing choice, and pg and PGLite disagree (pg:
* int8 -> string, date -> local-midnight Date; PGLite: int8 -> BigInt, which
* JSON.stringify rejects, date -> UTC Date). Normalize both so preview and
* production return identical, JSON-safe shapes:
*   int8/bigint (incl. count(*)) -> number (past 2^53 loses precision — cast
*                                   `::text` if you ever need huge integers)
*   date                         -> 'YYYY-MM-DD' string
*   interval                     -> Postgres interval text
* numeric already comes back as a string on both (arbitrary precision).
*/
var OID_INT8 = 20;
var OID_DATE = 1082;
var OID_INTERVAL = 1186;
var identity = (v) => v;
/** Wrap a query runner in the tagged-template + `.query()` `Sql` surface. */
function toSql(run) {
	const sql = (async (strings, ...values) => {
		let text = strings[0];
		for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1]}`;
		return run(text, values);
	});
	sql.query = (text, params = []) => run(text, params);
	return sql;
}
function createNeonSql() {
	globalRef.__pgSqlPromise__ ??= (async () => {
		const { Pool, types } = await import("../_libs/pg.mjs").then((n) => n.t);
		types.setTypeParser(OID_INT8, Number);
		types.setTypeParser(OID_DATE, identity);
		types.setTypeParser(OID_INTERVAL, identity);
		const pool = new Pool({ connectionString: databaseUrl });
		return toSql(async (text, params) => {
			return (await pool.query(text, params)).rows;
		});
	})().catch((err) => {
		globalRef.__pgSqlPromise__ = void 0;
		throw err;
	});
	return globalRef.__pgSqlPromise__;
}
async function createPgliteSql() {
	globalRef.__pgliteInstance__ ??= (async () => {
		const { PGlite } = await import("../_libs/electric-sql__pglite.mjs").then((n) => n.t);
		const pg = new PGlite({ parsers: {
			[OID_INT8]: Number,
			[OID_DATE]: identity,
			[OID_INTERVAL]: identity
		} });
		await pg.waitReady;
		await pg.exec("create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())");
		return pg;
	})().catch((err) => {
		globalRef.__pgliteInstance__ = void 0;
		throw err;
	});
	const pg = await globalRef.__pgliteInstance__;
	const migrate = async () => {
		const migrations = /* #__PURE__ */ Object.assign({ "/migrations/0002_kreia_jobs.sql": _0002_kreia_jobs_default });
		const done = (await pg.query("select name from _migrations")).rows.map((r) => r.name);
		for (const { name, path } of pendingMigrations(Object.keys(migrations), done)) await pg.transaction(async (tx) => {
			await tx.exec(migrations[path]);
			await tx.query("insert into _migrations (name) values ($1)", [name]);
		});
	};
	const pass = (globalRef.__pgliteMigrateChain__ ?? Promise.resolve()).catch(() => void 0).then(migrate);
	globalRef.__pgliteMigrateChain__ = pass;
	await pass;
	return toSql(async (text, params) => {
		return (await pg.query(text, params)).rows;
	});
}
var sqlPromise = null;
async function createSql() {
	if (typeof window !== "undefined") throw new Error("@/lib/db is server-only — call getSql() from a createServerFn handler or a server route loader, never from client code.");
	return dbSource === "neon" ? createNeonSql() : createPgliteSql();
}
/**
* Get the shared, **server-only** SQL client. Neon when `DATABASE_URL` is set,
* otherwise the local PGLite fallback. Memoized — safe to call per request.
*
* Schema comes from `migrations/*.sql`, auto-applied before the first query on
* both backends — define tables there, never inline in server functions.
*/
function getSql() {
	sqlPromise ??= createSql().catch((err) => {
		sqlPromise = null;
		throw err;
	});
	return sqlPromise;
}
/**
* Finish DB bootstrap before the server handles traffic.
*
* - **PGLite** (preview / no `DATABASE_URL`): open the in-memory DB and apply
*   `migrations/*.sql`. Idempotent — concurrent callers share one promise.
* - **Neon**: no-op (pool is created lazily on first query).
*
* Vite `configureServer` awaits this at dev startup; production imports of this
* module kick it off immediately (see bottom of file).
*/
function ensureDbReady() {
	if (dbSource !== "pglite") return Promise.resolve();
	return getSql().then(() => void 0);
}
var globalBoot = globalThis;
if (typeof window === "undefined" && dbSource === "pglite") globalBoot.__pgBootstrapPromise__ ??= ensureDbReady().catch((err) => {
	globalBoot.__pgBootstrapPromise__ = void 0;
	console.error("[db] PGLite bootstrap failed:", err);
	throw err;
});
var MAX_AGE_MS$1 = 18e5;
var STALE_RUNNING_MS = 12e5;
function safeId(id) {
	const trimmed = id.trim();
	if (!trimmed || trimmed.length > 80) return null;
	if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return null;
	return trimmed;
}
var tableReady = null;
async function ensureTable() {
	tableReady ??= (async () => {
		const sql = await getSql();
		await sql.query(`
      create table if not exists kreia_jobs (
        id text primary key,
        type text not null,
        status text not null,
        result jsonb,
        error text,
        progress jsonb,
        checkpoint jsonb,
        payload jsonb,
        frames jsonb not null default '[]'::jsonb,
        audio_chunks jsonb not null default '[]'::jsonb,
        phase text,
        working boolean not null default false,
        created_at bigint not null,
        updated_at bigint not null
      )
    `);
		await sql.query(`create index if not exists kreia_jobs_updated_at_idx on kreia_jobs (updated_at)`);
	})().catch((err) => {
		tableReady = null;
		throw err;
	});
	await tableReady;
}
function asJson(value) {
	return JSON.stringify(value ?? null);
}
function parseJson(value, fallback) {
	if (value == null) return fallback;
	if (typeof value === "string") try {
		return JSON.parse(value);
	} catch {
		return fallback;
	}
	return value;
}
function rowToJob(row) {
	const createdAt = Number(row.created_at) || Date.now();
	const updatedAt = Number(row.updated_at) || createdAt;
	const status = row.status === "pending" || row.status === "running" || row.status === "ok" || row.status === "error" ? row.status : "pending";
	return {
		id: row.id,
		type: row.type,
		status,
		result: parseJson(row.result, void 0),
		error: row.error ?? void 0,
		progress: parseJson(row.progress, void 0),
		checkpoint: parseJson(row.checkpoint, void 0),
		payload: parseJson(row.payload, void 0),
		phase: row.phase ?? void 0,
		working: Boolean(row.working),
		createdAt,
		updatedAt,
		frames: parseJson(row.frames, []),
		audioChunks: parseJson(row.audio_chunks, [])
	};
}
async function persistJob(job, opts) {
	const id = safeId(job.id);
	if (!id) return;
	try {
		const sql = await getSql();
		await ensureTable();
		const now = Date.now();
		const frames = opts?.light ? void 0 : job.frames ?? [];
		const audio = opts?.light ? void 0 : job.audioChunks ?? [];
		if (opts?.light) {
			await sql.query(`update kreia_jobs set
          type = $2,
          status = $3,
          result = $4::jsonb,
          error = $5,
          progress = $6::jsonb,
          checkpoint = $7::jsonb,
          payload = $8::jsonb,
          phase = $9,
          working = $10,
          updated_at = $11
        where id = $1`, [
				id,
				job.type,
				job.status,
				asJson(job.result ?? null),
				job.error ?? null,
				asJson(job.progress ?? null),
				asJson(job.checkpoint ?? null),
				asJson(job.payload ?? null),
				job.phase ?? null,
				Boolean(job.working),
				now
			]);
			return;
		}
		await sql.query(`insert into kreia_jobs (
          id, type, status, result, error, progress, checkpoint, payload,
          frames, audio_chunks, phase, working, created_at, updated_at
        ) values (
          $1, $2, $3, $4::jsonb, $5, $6::jsonb, $7::jsonb, $8::jsonb,
          $9::jsonb, $10::jsonb, $11, $12, $13, $14
        )
        on conflict (id) do update set
          type = excluded.type,
          status = excluded.status,
          result = excluded.result,
          error = excluded.error,
          progress = excluded.progress,
          checkpoint = excluded.checkpoint,
          payload = excluded.payload,
          frames = excluded.frames,
          audio_chunks = excluded.audio_chunks,
          phase = excluded.phase,
          working = excluded.working,
          updated_at = excluded.updated_at`, [
			id,
			job.type,
			job.status,
			asJson(job.result ?? null),
			job.error ?? null,
			asJson(job.progress ?? null),
			asJson(job.checkpoint ?? null),
			asJson(job.payload ?? null),
			asJson(frames),
			asJson(audio),
			job.phase ?? null,
			Boolean(job.working),
			job.createdAt || now,
			now
		]);
	} catch (err) {
		console.error("[ANALYSIS SESSION] persist failed", job.id, err);
	}
}
async function readJob(id) {
	const safe = safeId(id);
	if (!safe) return null;
	try {
		const sql = await getSql();
		await ensureTable();
		const row = (await sql.query("select * from kreia_jobs where id = $1", [safe]))[0];
		if (!row) return null;
		const parsed = rowToJob(row);
		if (Date.now() - parsed.createdAt > MAX_AGE_MS$1) {
			await forgetJob(safe);
			return null;
		}
		if (parsed.status === "running" && Date.now() - (parsed.updatedAt || parsed.createdAt) > STALE_RUNNING_MS) {
			parsed.status = "error";
			parsed.error = "L'analyse a dépassé le délai prévu. Reprenez l'analyse.";
			parsed.working = false;
			await persistJob(parsed, { light: true });
		}
		return parsed;
	} catch (err) {
		console.error("[ANALYSIS SESSION] read failed", id, err);
		return null;
	}
}
async function tryLockJob(id) {
	const safe = safeId(id);
	if (!safe) return null;
	try {
		const sql = await getSql();
		await ensureTable();
		const staleBefore = Date.now() - 15e4;
		const row = (await sql.query(`update kreia_jobs
       set working = true, updated_at = $2
       where id = $1
         and status = 'running'
         and (working = false or updated_at < $3)
       returning *`, [
			safe,
			Date.now(),
			staleBefore
		]))[0];
		return row ? rowToJob(row) : null;
	} catch (err) {
		console.error("[ANALYSIS SESSION] lock failed", id, err);
		return null;
	}
}
async function forgetJob(id) {
	const safe = safeId(id);
	if (!safe) return;
	try {
		const sql = await getSql();
		await ensureTable();
		await sql.query("delete from kreia_jobs where id = $1", [safe]);
	} catch {}
}
async function pruneJobFiles() {
	try {
		const sql = await getSql();
		await ensureTable();
		const cutoff = Date.now() - MAX_AGE_MS$1;
		await sql.query("delete from kreia_jobs where created_at < $1", [cutoff]);
	} catch {}
}
function directionBlock(direction) {
	if (direction === "strict") return `DIRECTION : RESPECT STRICT. Ne complète que l'indispensable. Ne change jamais un détail fourni. N'ajoute un personnage que s'il a une fonction réelle.`;
	if (direction === "develop") return `DIRECTION : DÉVELOPPEMENT. Enrichis l'histoire sans trahir le genre, les personnages nommés ni les caractéristiques déjà décrites.`;
	return `DIRECTION : ÉQUILIBRÉE. Respecte l'idée et tous les détails fournis. Complète seulement les zones manquantes.`;
}
function ideaKindBlock(kind) {
	return `${fruitHumanoidPromptBlock(kind === "fruit-humanoid")}${angelPromptBlock(kind === "angel")}${anatomyPromptBlock(kind === "human")}`;
}
function ideaIds(kind) {
	if (kind === "fruit-humanoid") return "FRUIT_CHARACTER_01…";
	if (kind === "angel") return "ANGEL_CHARACTER_01… pour les anges, CHARACTER_01… pour les humains";
	return "CHARACTER_01…";
}
function brief(input) {
	return `UNIVERS : ${input.kind === "fruit-humanoid" ? "Fruits humanoïdes" : input.kind === "angel" ? "Anges" : "Histoire humaine"}
${directionBlock(input.direction)}
IDÉE (prioritaire) :
${input.idea.trim()}
${input.extras?.trim() ? `PRÉCISIONS :\n${input.extras.trim()}` : "Pas de précisions."}
Durée cible : ${input.durationSeconds}s — ${input.sceneCount} scènes de 10s.`;
}
function ideaPhaseSystem(kind, phase) {
	return `Tu es le scénariste de KREIA Studio. Mode CRÉATION À PARTIR D'UNE IDÉE — pas d'analyse vidéo.
${ideaKindBlock(kind)}
JSON uniquement. Les faits fournis par l'utilisateur sont verrouillés.
IDs personnages : ${ideaIds(kind)}.
Phase : ${phase}.`.trim();
}
function ideaPhaseUser(input, cp, phase) {
	const ctx = brief(input);
	if (phase === "understand") return `${ctx}

Extrais la compréhension. JSON :
{"mainIdea":"","genre":"","conflict":"","events":[],"mentionedCharacters":[],"relations":[],"locations":[],"emotions":[],"givenFacts":[],"missing":[]}`;
	if (phase === "story") return `${ctx}

Compréhension : ${JSON.stringify(cp.understanding ?? {})}

Construis la structure narrative. JSON :
{"title":"","logline":"","subject":"","beginning":"","progression":"","conflict":"","twists":[],"climax":"","ending":"","tone":""}`;
	if (phase === "characters") return `${ctx}

Histoire : ${JSON.stringify(cp.story ?? {})}
Personnages mentionnés : ${(cp.understanding?.mentionedCharacters ?? []).join(", ") || "aucun nommé"}
Faits donnés : ${(cp.understanding?.givenFacts ?? []).join(" | ")}

Crée UNIQUEMENT les personnages nécessaires. Conserve les traits fournis. JSON :
{"characters":[{"id":"${input.kind === "fruit-humanoid" ? "FRUIT_CHARACTER_01" : "CHARACTER_01"}","name":"","designation":"","characterType":"human|fruit_humanoid|angel|unknown_character","species":"","appearance":"","complexion":"","hair":"","eyes":"","bodyStructure":"","morphology":"","clothing":"","accessories":"","wings":"","halo":"","distinctiveFeatures":"","role":"","personality":"","relationships":"","prominence":"principal","lockedTraits":[]}]}`;
	if (phase === "visual") return `${ctx}
${input.chosenStyleId ? `Style CHOISI, à respecter : ${styleFromUserChoice(input.chosenStyleId, input.chosenStyleText).lockedStylePhrase}` : "Aucun style choisi — propose un univers visuel cohérent."}
Ton : ${cp.story?.tone ?? ""}
JSON visualStyle + cinematic (lockedStylePhrase obligatoire).`;
	if (phase === "scenes") return `${ctx}

Histoire : ${JSON.stringify(cp.story ?? {})}
Personnages : ${(cp.characters ?? []).map((c) => `${c.id}=${c.name || c.designation}`).join("; ")}
Style : ${cp.visualStyle?.lockedStylePhrase ?? ""}

Produis EXACTEMENT ${input.sceneCount} scènes, estimatedDuration=10 chacune, continuum narratif.
JSON : {"scenes":[{"number":1,"estimatedDuration":10,"startHint":"0s","characters":[],"setting":"","action":"","emotion":"","camera":"","lighting":"","audio":"","dialogue":null,"dialogueSpeaker":null,"styleNotes":""}]}`;
	return `${ctx}

Scènes : ${JSON.stringify((cp.scenes ?? []).map((s) => ({
		n: s.number,
		action: s.action,
		characters: s.characters
	})))}
Personnages : ${(cp.characters ?? []).map((c) => `${c.id}=${c.name || c.designation}`).join("; ")}

Dialogues EN FRANÇAIS uniquement. Un locuteur à la fois. Max 2 personnages parlants par scène. Début rapide. Si une scène n'a pas besoin de parole, lines vides pour elle.
JSON : {"language":"fr","lines":[{"id":"D001","sceneNumber":1,"order":1,"speakerId":"CHARACTER_01","speakerLabel":"","sourceText":"réplique française","displayText":"même texte","emotion":"","intention":""}]}`;
}
function emptyCheckpoint() {
	return {
		version: 1,
		phase: "understand",
		completed: []
	};
}
function isRecord(v) {
	return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}
function str(v) {
	return typeof v === "string" ? v.trim() : "";
}
function strArr(v) {
	return Array.isArray(v) ? v.map((x) => str(x)).filter(Boolean) : [];
}
function parseUnderstanding(raw) {
	const o = isRecord(raw) ? raw : {};
	return {
		mainIdea: str(o.mainIdea) || str(o.idea),
		genre: str(o.genre),
		conflict: str(o.conflict),
		events: strArr(o.events),
		mentionedCharacters: strArr(o.mentionedCharacters),
		relations: strArr(o.relations),
		locations: strArr(o.locations),
		emotions: strArr(o.emotions),
		givenFacts: strArr(o.givenFacts),
		missing: strArr(o.missing)
	};
}
function parseStory(raw) {
	const o = isRecord(raw) ? raw : {};
	return {
		title: str(o.title),
		logline: str(o.logline),
		beginning: str(o.beginning),
		progression: str(o.progression),
		conflict: str(o.conflict),
		twists: strArr(o.twists),
		climax: str(o.climax),
		ending: str(o.ending),
		tone: str(o.tone),
		subject: str(o.subject)
	};
}
async function ideaChat(input, cp, phase) {
	const content = [{
		type: "text",
		text: ideaPhaseUser(input, cp, phase)
	}];
	if (phase === "visual" && input.styleImageDataUrl?.startsWith("data:image/")) content.push({
		type: "image_url",
		image_url: {
			url: input.styleImageDataUrl,
			detail: "low"
		}
	});
	const result = await chat({
		messages: [{
			role: "system",
			content: ideaPhaseSystem(input.kind, phase)
		}, {
			role: "user",
			content
		}],
		maxTokens: phase === "scenes" || phase === "dialogues" ? 3500 : 2200
	});
	if (!result || !result.ok) return fail(result?.error || "L'analyse n'a pas pu aboutir. Réessayez.");
	try {
		return {
			ok: true,
			json: extractJson(result.text)
		};
	} catch {
		return fail(`Réponse illisible pendant : ${ideaPhaseLabel(phase)}.`);
	}
}
function forceScenes(analysis, sceneCount) {
	const scenes = analysis.scenes.slice(0, sceneCount);
	while (scenes.length < sceneCount) {
		const n = scenes.length + 1;
		scenes.push({
			number: n,
			estimatedDuration: 10,
			startHint: `${(n - 1) * 10}s`,
			characters: analysis.characters[0] ? [analysis.characters[0].id] : [],
			setting: scenes.at(-1)?.setting || "",
			action: "Suite de l'histoire.",
			emotion: "",
			camera: "",
			lighting: "",
			audio: "",
			dialogue: null,
			dialogueSpeaker: null,
			styleNotes: "",
			confidence: "proposed",
			silentReactions: []
		});
	}
	analysis.scenes = scenes.map((s, i) => ({
		...s,
		number: i + 1,
		estimatedDuration: 10
	}));
	analysis.sceneCountEstimate = analysis.scenes.length;
	return analysis;
}
function assembleIdeaAnalysis(input, cp) {
	const story = cp.story;
	const parsed = parseAnalysis({
		observedSummary: story?.logline || cp.understanding?.mainIdea || input.idea,
		limitations: ["Projet créé à partir d'une idée, sans vidéo source.", `${input.durationSeconds}s visés, ${input.sceneCount} scènes de 10s.`],
		language: "fr",
		sceneCountEstimate: input.sceneCount,
		narrative: {
			subject: story?.subject || cp.understanding?.mainIdea || "",
			story: [
				story?.beginning,
				story?.progression,
				story?.climax,
				story?.ending
			].filter(Boolean).join(" "),
			context: cp.understanding?.mainIdea || "",
			initialSituation: story?.beginning || "",
			incitingIncident: story?.conflict || cp.understanding?.conflict || "",
			conflict: story?.conflict || "",
			stakes: "",
			evolution: story?.progression || "",
			climax: story?.climax || "",
			resolution: story?.ending || "",
			conclusion: story?.ending || "",
			cta: null,
			genre: cp.understanding?.genre || "",
			tone: story?.tone || "",
			confidence: "proposed"
		},
		hook: {
			firstSecondsDescription: story?.beginning || "",
			attentionMechanism: "entrée directe dans le conflit",
			revealedInfo: "",
			introducedConflict: story?.conflict || "",
			curiosityCreated: story?.logline || "",
			whyContinue: story?.progression || "",
			confidence: "proposed"
		},
		characters: cp.characters ?? [],
		visualStyle: cp.visualStyle,
		cinematic: cp.cinematic,
		scenes: cp.scenes ?? [],
		audio: {
			dialoguePresent: Boolean(cp.dialogues?.lines.length),
			voiceOverPresent: false,
			musicPresent: false,
			ambiencePresent: true,
			sfxPresent: false,
			silenceUsed: false,
			rhythm: "dialogue rapide",
			transcriptExcerpt: null,
			notes: "Dialogues originaux en français.",
			source: "unavailable"
		},
		dialogues: cp.dialogues ?? emptyDialogueBible()
	});
	parsed.characters = lockCharactersSourceNames(parsed.characters);
	let analysis = forceScenes(parsed, input.sceneCount);
	analysis.scenes = applyLinesToScenes(analysis.scenes, analysis.dialogues.lines);
	return analysis;
}
function weave(style) {
	return [
		style.lockedStylePhrase,
		style.renderType,
		style.artisticStyle,
		style.lighting,
		style.atmosphere,
		style.textures
	].filter((x) => x && String(x).trim()).join(", ");
}
function assembleIdeaProduction(analysis) {
	const style = weave(analysis.visualStyle);
	const characters = analysis.characters.map((c) => {
		const id = identityParagraph(c);
		return {
			id: c.id,
			bible: `${c.name || c.designation || c.id} — ${c.role}. ${c.personality} ${c.relationships}`.trim(),
			imagePrompt: `Reference portrait of ${c.name || c.id}. ${id}. ${style}. Single character, coherent anatomy, no extra limbs.`
		};
	});
	const scenes = analysis.scenes.map((s) => {
		const present = s.characters.map((id) => analysis.characters.find((c) => c.id === id)).filter(Boolean).map((c) => identityParagraph(c)).join(" | ");
		const spoken = s.dialogue ? `${s.dialogueSpeaker || "Personnage"} dit en français : « ${s.dialogue} ». Un seul locuteur, les autres bouche fermée, lip-sync précis.` : "Pas de dialogue parlé.";
		return {
			number: s.number,
			duration: 10,
			characters: s.characters,
			location: s.setting,
			action: s.action,
			emotion: s.emotion,
			camera: s.camera,
			lighting: s.lighting,
			visualStyle: style,
			audio: s.audio,
			dialogue: s.dialogue,
			videoPrompt: `${style}. ${s.setting}. ${present}. Action : ${s.action}. Émotion : ${s.emotion}. Caméra : ${s.camera}. ${spoken} Continuité du plan précédent. Anatomie cohérente.`,
			continuityNotes: "Même identité, mêmes traits, même style d'une scène à l'autre."
		};
	});
	const first = scenes[0];
	return {
		hook: {
			reconstructed: analysis.hook.firstSecondsDescription || analysis.narrative.initialSituation,
			visualPrompt: first?.videoPrompt || style,
			duration: 10,
			mechanism: analysis.hook.attentionMechanism
		},
		scenario: {
			logline: analysis.narrative.subject,
			synopsis: analysis.narrative.story,
			structure: [
				analysis.narrative.initialSituation,
				analysis.narrative.conflict,
				analysis.narrative.climax,
				analysis.narrative.conclusion
			].filter(Boolean).join(" → "),
			dialoguesNote: "Dialogues en français uniquement, un locuteur à la fois."
		},
		characters,
		visualStyle: {
			lockedPhrase: analysis.visualStyle.lockedStylePhrase,
			productionNotes: style,
			doNot: [
				"changer un visage",
				"ajouter des membres",
				"mélanger les identités",
				"parler une autre langue que le français"
			]
		},
		scenes
	};
}
async function runIdeaSlice(args) {
	const { data } = args;
	const cp = args.checkpoint ? {
		...args.checkpoint,
		completed: [...args.checkpoint.completed]
	} : emptyCheckpoint();
	const phase = args.phase;
	const progress = ideaProgressAt(phase);
	try {
		if (phase === "understand") {
			const out = await ideaChat(data, cp, phase);
			if (!out.ok) throw new Error(out.error);
			cp.understanding = parseUnderstanding(out.json);
		} else if (phase === "story") {
			const out = await ideaChat(data, cp, phase);
			if (!out.ok) throw new Error(out.error);
			cp.story = parseStory(out.json);
		} else if (phase === "characters") {
			const out = await ideaChat(data, cp, phase);
			if (!out.ok) throw new Error(out.error);
			const parsed = parseAnalysis(out.json);
			cp.characters = lockCharactersSourceNames(parsed.characters.length ? parsed.characters : isRecord(out.json) && Array.isArray(out.json.characters) ? out.json.characters.map((c, i) => parseCharacter(c, i, data.kind)) : []);
			if (!cp.characters.length) cp.characters = [parseCharacter({
				id: data.kind === "fruit-humanoid" ? "FRUIT_CHARACTER_01" : "CHARACTER_01",
				name: null,
				designation: "Personnage principal",
				characterType: data.kind === "fruit-humanoid" ? "fruit_humanoid" : data.kind === "angel" ? "angel" : "human",
				appearance: "",
				role: "Protagoniste",
				prominence: "principal"
			}, 0, data.kind)];
		} else if (phase === "visual") {
			if (data.chosenStyleId) {
				cp.visualStyle = styleFromUserChoice(data.chosenStyleId, data.chosenStyleText);
				cp.cinematic = {
					dominantShots: ["plan rapproché", "plan moyen"],
					cameraAngles: ["hauteur des yeux"],
					movements: ["caméra fluide"],
					lightingStyle: cp.visualStyle.lighting,
					rhythm: "cinématographique"
				};
			} else {
				const out = await ideaChat(data, cp, phase);
				if (!out.ok) throw new Error(out.error);
				const parsed = parseAnalysis(out.json);
				cp.visualStyle = parsed.visualStyle.lockedStylePhrase ? parsed.visualStyle : styleFromUserChoice("cinematic-real");
				cp.cinematic = parsed.cinematic;
			}
		} else if (phase === "scenes") {
			const out = await ideaChat(data, cp, phase);
			if (!out.ok) throw new Error(out.error);
			const parsed = parseAnalysis(out.json);
			cp.scenes = forceScenes({
				...parsed,
				characters: cp.characters ?? parsed.characters
			}, data.sceneCount).scenes;
		} else if (phase === "dialogues") {
			const out = await ideaChat(data, cp, phase);
			if (!out.ok) throw new Error(out.error);
			const parsed = parseAnalysis(out.json);
			cp.dialogues = parsed.dialogues?.lines?.length ? parsed.dialogues : emptyDialogueBible();
			if (cp.dialogues.language !== "fr") cp.dialogues.language = "fr";
		} else {
			const analysis = assembleIdeaAnalysis(data, cp);
			let production = assembleIdeaProduction(analysis);
			try {
				production = parseProduction(production);
			} catch {}
			cp.analysis = analysis;
			cp.production = production;
			cp.completed = Array.from(/* @__PURE__ */ new Set([...cp.completed, phase]));
			cp.phase = "prepare";
			return {
				checkpoint: cp,
				nextPhase: "done",
				progress: ideaProgressAt("prepare"),
				done: true,
				analysis,
				production
			};
		}
		if (!cp.completed.includes(phase)) cp.completed.push(phase);
		const next = nextIdeaPhase(phase);
		cp.phase = next === "done" ? "prepare" : next;
		return {
			checkpoint: cp,
			nextPhase: next,
			progress: next === "done" ? ideaProgressAt("prepare") : ideaProgressAt(next),
			done: false
		};
	} catch (err) {
		const message = err instanceof Error && err.message.trim() ? err.message : NETWORK_MESSAGE;
		cp.failedPhase = phase;
		cp.failedMessage = message;
		return {
			checkpoint: cp,
			nextPhase: phase,
			progress,
			done: true,
			error: `Impossible de terminer : ${ideaPhaseLabel(phase)}. ${message}`
		};
	}
}
var JOB_TYPES = [
	"analyze",
	"generate",
	"ideate",
	"revise-analysis",
	"revise-production"
];
var JOB_MISSING = "La session d'analyse n'est plus disponible. Relancez l'analyse.";
var MAX_AGE_MS = 18e5;
var MAX_JOB_FRAMES = 12;
var MAX_JPEG_CHARS = 8e4;
var MAX_JOB_AUDIO = 12;
var MAX_AUDIO_CHUNK_CHARS = 24e4;
var LOCK_HOLD_MS = 15e4;
var STORE_KEY = Symbol.for("kreia.jobs.v3");
function store() {
	const g = globalThis;
	const existing = g[STORE_KEY];
	if (existing) return existing;
	const next = /* @__PURE__ */ new Map();
	g[STORE_KEY] = next;
	return next;
}
function toPersisted(job) {
	return {
		id: job.id,
		type: job.type,
		status: job.status,
		result: job.result,
		error: job.error,
		progress: job.progress,
		checkpoint: job.checkpoint,
		payload: job.payload,
		phase: job.phase,
		working: job.working,
		debug: job.debug,
		createdAt: job.createdAt,
		updatedAt: Date.now(),
		frames: job.frames,
		audioChunks: job.audioChunks
	};
}
function fromPersisted(data) {
	const type = isJobType(data.type) ? data.type : "analyze";
	return {
		id: data.id,
		type,
		status: data.status,
		result: data.result,
		error: data.error,
		frameCount: data.frames.length,
		progress: data.progress,
		phase: data.phase || "validate",
		debug: data.debug,
		createdAt: data.createdAt,
		updatedAt: data.updatedAt,
		frames: Array.isArray(data.frames) ? data.frames : [],
		audioChunks: Array.isArray(data.audioChunks) ? data.audioChunks : [],
		working: Boolean(data.working),
		checkpoint: data.checkpoint,
		payload: data.payload
	};
}
async function flush(job, light = false) {
	job.updatedAt = Date.now();
	store().set(job.id, job);
	await persistJob(toPersisted(job), { light });
}
async function load(id) {
	const disk = await readJob(id);
	if (!disk) {
		store().delete(id);
		return null;
	}
	const record = fromPersisted(disk);
	const mem = store().get(id);
	if (mem) {
		mem.status = record.status;
		mem.result = record.result;
		mem.error = record.error;
		mem.progress = record.progress;
		mem.checkpoint = record.checkpoint;
		mem.payload = record.payload ?? mem.payload;
		mem.phase = record.phase;
		mem.working = record.working;
		mem.debug = record.debug;
		mem.frames = record.frames.length ? record.frames : mem.frames;
		mem.audioChunks = record.audioChunks.length ? record.audioChunks : mem.audioChunks;
		mem.updatedAt = record.updatedAt;
		return mem;
	}
	store().set(id, record);
	return record;
}
async function prune() {
	const now = Date.now();
	for (const [id, job] of store()) if (now - job.createdAt > MAX_AGE_MS) store().delete(id);
	await pruneJobFiles();
}
function snapshot(job) {
	return {
		id: job.id,
		type: job.type,
		status: job.status,
		result: job.result,
		error: job.error,
		frameCount: job.frames.length,
		progress: job.progress,
		phase: job.phase,
		debug: job.debug
	};
}
function isJobType(value) {
	return typeof value === "string" && JOB_TYPES.includes(value);
}
function toDataUrl(jpeg) {
	const raw = jpeg.trim();
	if (!raw) return null;
	if (raw.startsWith("data:image/")) {
		if (raw.length > MAX_JPEG_CHARS) return null;
		return raw;
	}
	if (raw.length > MAX_JPEG_CHARS) return null;
	return `data:image/jpeg;base64,${raw}`;
}
function progressForPhase(phase) {
	if (phase === "validate") return progressAt(1);
	if (phase === "structure") return progressAt(2);
	if (phase === "transcript") return progressAt(2);
	if (phase === "cast") return progressAt(3);
	if (phase === "style") return progressAt(4);
	if (phase === "compact") return progressAt(5, { compact: true });
	if (phase === "segment") return progressAt(5);
	if (phase === "narrative") return progressAt(6);
	if (phase === "produce") return progressAt(7);
	return progressAt(7);
}
function isPhase(value) {
	return value === "validate" || value === "structure" || value === "transcript" || value === "cast" || value === "style" || value === "compact" || value === "segment" || value === "narrative" || value === "produce" || value === "done";
}
function isIdeaPhase(value) {
	return typeof value === "string" && IDEA_PHASE_ORDER.includes(value);
}
async function runAnalyzeSlice(job) {
	const data = {
		...job.payload && typeof job.payload === "object" ? { ...job.payload } : {},
		frames: job.frames,
		audioChunks: job.audioChunks
	};
	const phase = isPhase(job.phase) ? job.phase : "validate";
	job.progress = progressForPhase(phase);
	job.debug = `phase=${phase} frames=${job.frames.length} step=${job.progress.step}`;
	job.progress = {
		...job.progress,
		debug: job.debug
	};
	await flush(job, true);
	console.info("[PIPELINE] Session:", job.id);
	console.info("[PIPELINE] Current step:", phase, job.progress);
	const slice = await runPipelineSlice({
		data,
		checkpoint: job.checkpoint,
		phase
	});
	job.checkpoint = slice.checkpoint;
	job.progress = {
		...slice.progress,
		debug: `phase=${slice.nextPhase} done=${slice.done} chars=${slice.checkpoint.characters?.length ?? 0}`
	};
	job.phase = slice.nextPhase;
	job.debug = job.progress.debug;
	if (slice.awaitingCastReview) {
		job.status = "ok";
		job.result = {
			ok: true,
			awaitingCastReview: true,
			checkpoint: slice.checkpoint,
			characters: slice.checkpoint.characters ?? []
		};
		job.error = void 0;
		job.phase = slice.nextPhase;
		return;
	}
	if (slice.awaitingDialogueReview) {
		job.status = "ok";
		job.result = {
			ok: true,
			awaitingDialogueReview: true,
			checkpoint: slice.checkpoint,
			analysis: slice.analysis
		};
		job.error = void 0;
		job.phase = slice.nextPhase;
		return;
	}
	if (slice.done && slice.analysis) {
		job.status = "ok";
		job.result = {
			ok: true,
			analysis: slice.analysis,
			production: slice.production,
			checkpoint: slice.checkpoint
		};
		job.error = void 0;
		job.phase = "done";
		return;
	}
	if (slice.done && slice.error) {
		job.status = "error";
		job.error = slice.error;
		job.debug = `phase=${phase} error=${slice.error}`;
		job.result = {
			ok: false,
			error: slice.error,
			checkpoint: slice.checkpoint,
			incomplete: true,
			debug: job.debug
		};
		job.phase = "done";
	}
}
async function runIdeaJobSlice(job) {
	const data = job.payload && typeof job.payload === "object" ? job.payload : {};
	const phase = isIdeaPhase(job.phase) ? job.phase : resumeIdeaPhase(job.checkpoint);
	job.progress = ideaProgressAt(phase);
	job.debug = `idea phase=${phase}`;
	job.progress = {
		...job.progress,
		debug: job.debug
	};
	await flush(job, true);
	console.info("[IDEA PIPELINE]", {
		session: job.id,
		phase
	});
	const slice = await runIdeaSlice({
		data,
		checkpoint: job.checkpoint,
		phase
	});
	job.checkpoint = slice.checkpoint;
	job.progress = {
		...slice.progress,
		debug: `idea next=${slice.nextPhase}`
	};
	job.phase = slice.nextPhase;
	job.debug = job.progress.debug;
	if (slice.done && slice.analysis) {
		job.status = "ok";
		job.result = {
			ok: true,
			analysis: slice.analysis,
			production: slice.production,
			checkpoint: slice.checkpoint
		};
		job.error = void 0;
		job.phase = "done";
		return;
	}
	if (slice.done && slice.error) {
		job.status = "error";
		job.error = slice.error;
		job.debug = `idea phase=${phase} error=${slice.error}`;
		job.result = {
			ok: false,
			error: slice.error,
			checkpoint: slice.checkpoint,
			incomplete: true,
			failedPhase: phase
		};
		job.phase = "done";
	}
}
async function runProduceJobSlice(job) {
	const data = job.payload && typeof job.payload === "object" ? job.payload : {};
	job.progress = progressAt(7);
	await flush(job, true);
	const slice = await runProductionSlice({
		...data,
		checkpoint: job.checkpoint ?? data.checkpoint
	});
	job.checkpoint = slice.checkpoint;
	job.progress = slice.progress;
	job.debug = `produce ${slice.progress.productionScenesDone ?? 0}/${slice.progress.productionScenesTotal ?? 0}`;
	if (slice.done && slice.production) {
		job.status = "ok";
		job.result = {
			ok: true,
			production: slice.production,
			checkpoint: slice.checkpoint
		};
		job.error = void 0;
		job.phase = "done";
		return;
	}
	if (slice.done && slice.error) {
		job.status = "error";
		job.error = slice.error;
		job.result = {
			ok: false,
			error: slice.error,
			checkpoint: slice.checkpoint,
			incomplete: true
		};
		job.phase = "done";
		return;
	}
	job.phase = "produce";
}
async function runSingleShot(job) {
	const payload = job.payload;
	let out;
	try {
		switch (job.type) {
			case "generate":
				out = {
					ok: false,
					error: NETWORK_MESSAGE
				};
				break;
			case "revise-analysis":
				out = await runReviseAnalysis(payload);
				break;
			case "revise-production":
				out = await runReviseProduction(payload);
				break;
			default: out = {
				ok: false,
				error: NETWORK_MESSAGE
			};
		}
	} catch (err) {
		out = {
			ok: false,
			error: err instanceof Error && err.message.trim() ? err.message : NETWORK_MESSAGE
		};
	}
	if (!out || typeof out.ok !== "boolean") {
		job.status = "error";
		job.error = NETWORK_MESSAGE;
	} else if (!out.ok) {
		job.status = "error";
		job.error = out.error || "L'analyse n'a pas pu aboutir. Réessayez.";
		job.result = out;
	} else {
		job.status = "ok";
		job.result = out;
	}
	job.phase = "done";
}
async function advanceJob(id) {
	const current = await load(id);
	if (!current) return null;
	if (current.status === "ok" || current.status === "error") return snapshot(current);
	if (current.status !== "running") return snapshot(current);
	if (!await tryLockJob(id)) {
		const latest = await load(id);
		if (!latest) return snapshot(current);
		if (latest.status !== "running") return snapshot(latest);
		if (latest.working && Date.now() - latest.updatedAt < LOCK_HOLD_MS) return snapshot(latest);
	}
	const job = await load(id) ?? current;
	job.working = true;
	store().set(job.id, job);
	try {
		if (job.type === "analyze") await runAnalyzeSlice(job);
		else if (job.type === "ideate") await runIdeaJobSlice(job);
		else if (job.type === "generate") await runProduceJobSlice(job);
		else await runSingleShot(job);
	} catch (err) {
		console.error("[ANALYSIS FAILED]", {
			session: job.id,
			phase: job.phase,
			errorMessage: err instanceof Error ? err.message : String(err)
		});
		job.status = "error";
		job.error = err instanceof Error && err.message.trim() ? err.message : NETWORK_MESSAGE;
		job.debug = `phase=${job.phase} catch=${job.error}`;
		job.phase = "done";
	} finally {
		job.working = false;
		await flush(job, false);
	}
	return snapshot(job);
}
async function createJob(type) {
	await prune();
	const id = createId("job");
	const record = {
		id,
		type,
		status: "pending",
		createdAt: Date.now(),
		updatedAt: Date.now(),
		frames: [],
		audioChunks: [],
		phase: type === "ideate" ? "understand" : "validate",
		working: false
	};
	store().set(id, record);
	await flush(record);
	console.info("[kreia:job] created", {
		id,
		type
	});
	return snapshot(record);
}
async function appendFrame(id, t, jpeg) {
	await prune();
	const job = await load(id);
	if (!job) return {
		ok: false,
		error: JOB_MISSING,
		status: 404
	};
	if (job.status !== "pending") return {
		ok: false,
		error: "Ce travail n'accepte plus d'images."
	};
	if (job.frames.length >= MAX_JOB_FRAMES) return {
		ok: false,
		error: "Trop d'images."
	};
	const dataUrl = toDataUrl(jpeg);
	if (!dataUrl) return {
		ok: false,
		error: "Image illisible ou trop lourde."
	};
	const time = Number(t);
	job.frames.push({
		t: Number.isFinite(time) ? time : job.frames.length,
		dataUrl
	});
	await flush(job);
	return {
		ok: true,
		snapshot: snapshot(job)
	};
}
async function appendAudio(id, t, wav) {
	await prune();
	const job = await load(id);
	if (!job) return {
		ok: false,
		error: JOB_MISSING,
		status: 404
	};
	if (job.status !== "pending") return {
		ok: false,
		error: "Ce travail n'accepte plus d'audio."
	};
	if (job.audioChunks.length >= MAX_JOB_AUDIO) return {
		ok: false,
		error: "Trop de pistes audio."
	};
	const raw = wav.trim();
	if (!raw || raw.length > MAX_AUDIO_CHUNK_CHARS) return {
		ok: false,
		error: "Piste audio illisible ou trop lourde."
	};
	const time = Number(t);
	job.audioChunks.push({
		t: Number.isFinite(time) ? time : job.audioChunks.length * 8,
		wavBase64: raw
	});
	await flush(job);
	return {
		ok: true,
		snapshot: snapshot(job)
	};
}
async function startPendingJob(id, payload) {
	await prune();
	const job = await load(id);
	if (!job) return {
		error: JOB_MISSING,
		status: 404
	};
	if (job.status === "ok" || job.status === "error") return { snapshot: snapshot(job) };
	if (job.status === "running") return { snapshot: await advanceJob(job.id) ?? snapshot(job) };
	const base = payload && typeof payload === "object" ? { ...payload } : {};
	if (job.type === "analyze") {
		delete base.audioWavBase64;
		job.checkpoint = base.checkpoint ?? job.checkpoint;
		delete base.frames;
		delete base.audioChunks;
	}
	if (job.type === "ideate") job.checkpoint = base.checkpoint ?? job.checkpoint;
	if (job.type === "generate") job.checkpoint = base.checkpoint ?? job.checkpoint;
	job.payload = base;
	job.status = "running";
	job.phase = job.type === "analyze" ? "validate" : job.type === "ideate" ? resumeIdeaPhase(job.checkpoint) : job.type === "generate" ? "produce" : "generate";
	job.working = false;
	await flush(job);
	return { snapshot: await advanceJob(job.id) ?? snapshot(job) };
}
async function startJob(type, payload) {
	await prune();
	const created = await createJob(type);
	const started = await startPendingJob(created.id, payload);
	if ("error" in started) return { snapshot: {
		id: created.id,
		type,
		status: "error",
		error: started.error
	} };
	return started;
}
async function identifyOnly(id) {
	const job = await load(id);
	if (!job) return {
		success: false,
		error: JOB_MISSING,
		status: 404
	};
	const payload = job.payload && typeof job.payload === "object" ? job.payload : {};
	const kind = typeof payload.kind === "string" ? payload.kind : "human";
	console.info("[CHARACTERS] ISOLATION TEST START", {
		id,
		frames: job.frames.length,
		kind
	});
	try {
		const { identifyCharacters } = await import("./cast-edit-B0U-aGNG.mjs").then((n) => n.u).then((n) => n.a);
		const cast = await identifyCharacters({
			frames: job.frames,
			kind,
			durationSeconds: Number(payload.durationSeconds) || 0,
			width: Number(payload.width) || 0,
			height: Number(payload.height) || 0,
			userNotes: typeof payload.userNotes === "string" ? payload.userNotes : void 0,
			batchIndex: 0
		});
		console.info("[CHARACTERS] ISOLATION TEST END", {
			id,
			count: cast.characters.length
		});
		return {
			success: true,
			characters: cast.characters,
			count: cast.characters.length
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error("[CHARACTERS] ISOLATION TEST FAIL", {
			id,
			message
		});
		return {
			success: false,
			error: message
		};
	}
}
function json(data, status = 200) {
	return Response.json(data, {
		status,
		headers: {
			"x-kreia": "jobs",
			"cache-control": "no-store"
		}
	});
}
async function handleKreiaJobsRequest(request) {
	const method = request.method.toUpperCase();
	if (method === "OPTIONS") return new Response(null, {
		status: 204,
		headers: {
			"access-control-allow-methods": "GET, POST, OPTIONS",
			"access-control-allow-headers": "content-type",
			"x-kreia": "jobs"
		}
	});
	if (method === "GET") {
		const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
		if (!id) return json({
			ok: true,
			service: "kreia-jobs"
		});
		const job = await advanceJob(id);
		if (!job) return json({
			ok: false,
			error: JOB_MISSING
		}, 404);
		return json(job);
	}
	if (method !== "POST") return json({
		ok: false,
		error: "Méthode non supportée."
	}, 405);
	let body;
	try {
		body = await request.json();
	} catch {
		return json({
			ok: false,
			error: "Requête illisible."
		}, 400);
	}
	const rec = body && typeof body === "object" ? body : {};
	const op = typeof rec.op === "string" ? rec.op : "run";
	if (op === "poll" || op === "status") {
		const id = typeof rec.id === "string" ? rec.id : "";
		if (!id) return json({
			ok: false,
			error: JOB_MISSING
		}, 400);
		const job = await advanceJob(id);
		if (!job) return json({
			ok: false,
			error: JOB_MISSING
		}, 404);
		return json(job);
	}
	if (op === "create") {
		if (!isJobType(rec.type)) return json({
			ok: false,
			error: "Type de tâche inconnu."
		}, 400);
		return json(await createJob(rec.type));
	}
	if (op === "frame") {
		const id = typeof rec.id === "string" ? rec.id : "";
		const jpeg = typeof rec.jpeg === "string" ? rec.jpeg : "";
		const added = await appendFrame(id, Number(rec.t), jpeg);
		if (!added.ok) return json({
			ok: false,
			error: added.error
		}, added.status ?? 400);
		return json(added.snapshot);
	}
	if (op === "audio") {
		const id = typeof rec.id === "string" ? rec.id : "";
		const wav = typeof rec.wav === "string" ? rec.wav : "";
		const added = await appendAudio(id, Number(rec.t), wav);
		if (!added.ok) return json({
			ok: false,
			error: added.error
		}, added.status ?? 400);
		return json(added.snapshot);
	}
	if (op === "identify") {
		const id = typeof rec.id === "string" ? rec.id : "";
		if (!id) return json({
			ok: false,
			error: JOB_MISSING
		}, 400);
		return json(await identifyOnly(id));
	}
	if (op === "start") {
		const started = await startPendingJob(typeof rec.id === "string" ? rec.id : "", rec.payload);
		if ("error" in started) return json({
			ok: false,
			error: started.error
		}, started.status ?? 400);
		console.info("[kreia:jobs] started", {
			id: started.snapshot.id,
			type: started.snapshot.type
		});
		return json(started.snapshot);
	}
	if (op === "run") {
		if (!isJobType(rec.type)) return json({
			ok: false,
			error: "Type de tâche inconnu."
		}, 400);
		if (rec.payload == null || typeof rec.payload !== "object") return json({
			ok: false,
			error: "Charge utile manquante."
		}, 400);
		const { snapshot } = await startJob(rec.type, rec.payload);
		console.info("[kreia:jobs] run", {
			id: snapshot.id,
			type: snapshot.type
		});
		return json(snapshot);
	}
	return json({
		ok: false,
		error: "Opération inconnue."
	}, 400);
}
//#endregion
export { handleKreiaJobsRequest };
