import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as require_jsx_runtime, f as useRouterState, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as createId } from "./ids-Bermtrku.mjs";
import { f as Folder, o as Plus } from "../_libs/lucide-react.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { t as create } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/store-vNv43kSC.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[transform,background-color,color,opacity,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:pointer-events-none disabled:opacity-40 active:not-disabled:scale-[0.96] [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			primary: "bg-[var(--fg)] text-[var(--bg)] hover:bg-white",
			secondary: "bg-[var(--bg-subtle)] text-[var(--fg)] shadow-[var(--shadow-border)] hover:bg-[var(--accent-fill)]",
			ghost: "bg-transparent text-[var(--fg)] hover:bg-[color-mix(in_oklab,var(--fg)_8%,transparent)]",
			outline: "bg-transparent text-[var(--fg)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--fg)_16%,transparent)] hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)]",
			danger: "bg-[color-mix(in_oklab,var(--color-danger)_18%,transparent)] text-[#f3c7bf] hover:bg-[color-mix(in_oklab,var(--color-danger)_28%,transparent)]"
		},
		size: {
			sm: "h-9 rounded-[var(--radius-sm)] px-3 text-sm",
			md: "h-11 rounded-[var(--radius-md)] px-4 text-sm",
			lg: "h-12 rounded-[var(--radius-md)] px-5 text-base",
			icon: "size-11 rounded-[var(--radius-md)]"
		}
	},
	defaultVariants: {
		variant: "primary",
		size: "md"
	}
});
var Button = (0, import_react.forwardRef)(({ className, variant, size, asChild, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		ref,
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
});
Button.displayName = "Button";
function Mark({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: "/brand/mark.png",
		alt: "",
		className: cn("size-9 rounded-full object-cover", className)
	});
}
function Wordmark({ compact = false, to = "/" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to,
		className: "flex items-center gap-2.5 no-underline",
		"aria-label": "KREIA Studio",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, { className: compact ? "size-9" : "size-11" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "flex flex-col leading-none",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-display text-[1.4rem] font-medium tracking-[-0.03em] text-[var(--fg)]",
				children: "KREIA"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: cn("mt-0.5 font-medium uppercase tracking-[0.22em] text-[var(--champagne)]", compact ? "text-[9px]" : "text-[10px]"),
				children: "Studio"
			})]
		})]
	});
}
function AppShell({ children }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative min-h-dvh bg-[var(--bg)] text-[var(--fg)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "studio-wash",
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "film-grain",
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "sticky top-0 z-30 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--bg)_88%,transparent)] pt-[env(safe-area-inset-top)] backdrop-blur-md",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wordmark, { compact: true }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
						className: "flex items-center gap-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/projects",
							"aria-label": "Mes projets",
							className: cn("inline-flex h-11 items-center gap-2 rounded-[var(--radius-md)] px-3 text-sm text-[var(--fg)]/80 transition-colors duration-150 hover:text-[var(--fg)]", pathname.startsWith("/projects") && "text-[var(--fg)]"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Folder, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "hidden sm:inline",
								children: "Mes projets"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							size: "sm",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/new",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "Nouveau"]
							})
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "relative z-10 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10",
				children
			})
		]
	});
}
var MAX_WIDTH = 640;
var JPEG_QUALITY = .52;
function wait(el, event, timeoutMs = 12e3) {
	return new Promise((resolve, reject) => {
		const t = window.setTimeout(() => {
			cleanup();
			reject(/* @__PURE__ */ new Error("Lecture vidéo trop longue à démarrer."));
		}, timeoutMs);
		const onOk = () => {
			cleanup();
			resolve();
		};
		const onErr = () => {
			cleanup();
			reject(/* @__PURE__ */ new Error("Fichier vidéo incompatible ou corrompu."));
		};
		const cleanup = () => {
			window.clearTimeout(t);
			el.removeEventListener(event, onOk);
			el.removeEventListener("error", onErr);
		};
		el.addEventListener(event, onOk, { once: true });
		el.addEventListener("error", onErr, { once: true });
	});
}
async function loadVideoElement(src) {
	const video = document.createElement("video");
	video.muted = true;
	video.playsInline = true;
	video.preload = "auto";
	video.crossOrigin = "anonymous";
	video.src = src;
	video.load();
	await wait(video, "loadedmetadata");
	if (!Number.isFinite(video.duration) || video.duration < .4) throw new Error("Cette vidéo est trop courte pour être analysée.");
	try {
		await video.play();
		video.pause();
	} catch {}
	return video;
}
function frameTimes(duration) {
	const hook = [.12, Math.min(1.4, duration * .08)];
	const restCount = Math.max(4, 8 - hook.length);
	const start = Math.min(2.2, duration * .12);
	const end = Math.max(start + .3, duration - .18);
	const rest = [];
	for (let i = 0; i < restCount; i += 1) {
		const t = start + (end - start) * i / Math.max(1, restCount - 1);
		rest.push(t);
	}
	const all = [...hook, ...rest].map((t) => Math.min(duration - .05, Math.max(.05, t))).sort((a, b) => a - b);
	const unique = [];
	for (const t of all) if (!unique.some((u) => Math.abs(u - t) < .18)) unique.push(t);
	return unique.slice(0, 8);
}
async function seek(video, t) {
	if (Math.abs(video.currentTime - t) < .04) return;
	await new Promise((resolve, reject) => {
		const timer = window.setTimeout(() => {
			video.removeEventListener("seeked", onSeeked);
			reject(/* @__PURE__ */ new Error("Impossible d'extraire les images de cette vidéo."));
		}, 8e3);
		const onSeeked = () => {
			window.clearTimeout(timer);
			video.removeEventListener("seeked", onSeeked);
			resolve();
		};
		video.addEventListener("seeked", onSeeked);
		video.currentTime = t;
	});
}
function capture(video) {
	const w = video.videoWidth || 640;
	const h = video.videoHeight || 360;
	const scale = Math.min(1, MAX_WIDTH / w);
	const canvas = document.createElement("canvas");
	canvas.width = Math.max(2, Math.round(w * scale));
	canvas.height = Math.max(2, Math.round(h * scale));
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Capture d'image impossible sur cet appareil.");
	ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
	return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}
async function extractFrames(video, onProgress) {
	const times = frameTimes(video.duration);
	const frames = [];
	for (let i = 0; i < times.length; i += 1) {
		await seek(video, times[i]);
		await new Promise((r) => requestAnimationFrame(() => r(null)));
		frames.push({
			t: times[i],
			dataUrl: capture(video)
		});
		onProgress?.(i + 1, times.length);
	}
	return frames;
}
function pickFrameIndices(length, count) {
	if (length <= 0) return [];
	if (count <= 1) return [0];
	if (length <= count) return Array.from({ length }, (_, i) => i);
	const set = /* @__PURE__ */ new Set();
	set.add(0);
	set.add(length - 1);
	for (let i = 1; i < count - 1; i += 1) set.add(Math.round(i * (length - 1) / (count - 1)));
	return [...set].sort((a, b) => a - b).slice(0, count);
}
function loadImage(src) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(/* @__PURE__ */ new Error("Image illisible."));
		img.src = src;
	});
}
async function recodeDataUrl(dataUrl, opts) {
	if (!dataUrl.startsWith("data:image/")) return dataUrl;
	const img = await loadImage(dataUrl);
	const scale = Math.min(1, opts.maxWidth / Math.max(1, img.width));
	const canvas = document.createElement("canvas");
	canvas.width = Math.max(2, Math.round(img.width * scale));
	canvas.height = Math.max(2, Math.round(img.height * scale));
	const ctx = canvas.getContext("2d");
	if (!ctx) return dataUrl;
	ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
	return canvas.toDataURL("image/jpeg", opts.quality);
}
async function toAnalysisFrames(frames, opts) {
	const maxFrames = opts?.maxFrames ?? 6;
	const maxWidth = opts?.maxWidth ?? 512;
	const quality = opts?.quality ?? .42;
	const maxChars = opts?.maxChars ?? 55e3;
	const indices = pickFrameIndices(frames.length, maxFrames);
	const out = [];
	for (const i of indices) {
		const f = frames[i];
		try {
			let dataUrl = await recodeDataUrl(f.dataUrl, {
				maxWidth,
				quality
			});
			if (dataUrl.length > maxChars) dataUrl = await recodeDataUrl(f.dataUrl, {
				maxWidth: Math.min(maxWidth, 384),
				quality: Math.min(quality, .32)
			});
			if (dataUrl.length > maxChars) dataUrl = await recodeDataUrl(f.dataUrl, {
				maxWidth: 320,
				quality: .26
			});
			out.push({
				t: f.t,
				dataUrl
			});
		} catch {
			out.push(f);
		}
	}
	return out;
}
function videoMetaFromElement(video, fileName, source, sourceUrl) {
	return {
		durationSeconds: video.duration,
		width: video.videoWidth,
		height: video.videoHeight,
		fileName,
		source,
		sourceUrl
	};
}
function formatDuration(seconds) {
	if (!Number.isFinite(seconds) || seconds < 0) return "—";
	const s = Math.round(seconds);
	const m = Math.floor(s / 60);
	const r = s % 60;
	return m > 0 ? `${m} min ${String(r).padStart(2, "0")} s` : `${r} s`;
}
function formatTimecode(seconds) {
	const s = Math.max(0, seconds);
	const m = Math.floor(s / 60);
	const r = s - m * 60;
	return `${String(m).padStart(2, "0")}:${r.toFixed(1).padStart(4, "0")}`;
}
var DB_NAME = "kreia-lab";
var DB_VERSION = 1;
var STORE = "projects";
var LIST_KEY = "kreia.project-index";
function openDb() {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, DB_VERSION);
		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}
function txDone(tx) {
	return new Promise((resolve, reject) => {
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
		tx.onabort = () => reject(tx.error);
	});
}
function readIndex() {
	if (typeof localStorage === "undefined") return [];
	try {
		const raw = localStorage.getItem(LIST_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}
function writeIndex(items) {
	localStorage.setItem(LIST_KEY, JSON.stringify(items));
}
function toIndex(p) {
	return {
		id: p.id,
		title: p.title,
		updatedAt: p.updatedAt,
		status: p.status,
		kind: p.kind,
		thumbnailDataUrl: p.thumbnailDataUrl,
		durationSeconds: p.video.durationSeconds
	};
}
function listProjectIndex() {
	return readIndex().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
async function saveProject(project) {
	const db = await openDb();
	const tx = db.transaction(STORE, "readwrite");
	tx.objectStore(STORE).put(project);
	await txDone(tx);
	db.close();
	const items = readIndex().filter((i) => i.id !== project.id);
	items.unshift(toIndex(project));
	writeIndex(items);
}
async function loadProject(id) {
	const db = await openDb();
	const tx = db.transaction(STORE, "readonly");
	const req = tx.objectStore(STORE).get(id);
	const value = await new Promise((resolve, reject) => {
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
	await txDone(tx);
	db.close();
	return value ?? null;
}
async function deleteProject(id) {
	const db = await openDb();
	const tx = db.transaction(STORE, "readwrite");
	tx.objectStore(STORE).delete(id);
	await txDone(tx);
	db.close();
	writeIndex(readIndex().filter((i) => i.id !== id));
}
function titleFrom(meta) {
	return meta.fileName.replace(/\.[a-z0-9]+$/i, "").trim() || "Projet sans titre";
}
var useKreia = create((set, get) => ({
	hydrated: false,
	index: [],
	current: null,
	hydrate: async () => {
		set({
			index: listProjectIndex(),
			hydrated: true
		});
	},
	open: async (id) => {
		const project = await loadProject(id);
		set({ current: project });
		return project;
	},
	createDraft: async ({ kind, mode, video, frames, thumbnailDataUrl, userNotes }) => {
		const now = (/* @__PURE__ */ new Date()).toISOString();
		const project = {
			id: createId("prj"),
			title: titleFrom(video),
			createdAt: now,
			updatedAt: now,
			kind,
			mode,
			status: "analyzing",
			video,
			thumbnailDataUrl,
			frames,
			analysisEdits: [],
			userNotes
		};
		await saveProject(project);
		set({
			current: project,
			index: listProjectIndex()
		});
		return project;
	},
	patchCurrent: async (patch) => {
		const current = get().current;
		if (!current) return;
		const next = {
			...current,
			...patch,
			updatedAt: (/* @__PURE__ */ new Date()).toISOString()
		};
		await saveProject(next);
		set({
			current: next,
			index: listProjectIndex()
		});
	},
	setAnalysis: async (analysis) => {
		await get().patchCurrent({
			analysis,
			status: "analysis-ready",
			errorMessage: void 0
		});
	},
	setProduction: async (production) => {
		await get().patchCurrent({
			production,
			status: "complete",
			errorMessage: void 0
		});
	},
	remove: async (id) => {
		await deleteProject(id);
		const current = get().current;
		set({
			index: listProjectIndex(),
			current: current?.id === id ? null : current
		});
	}
}));
//#endregion
export { extractFrames as a, loadVideoElement as c, videoMetaFromElement as d, cn as i, toAnalysisFrames as l, Button as n, formatDuration as o, Mark as r, formatTimecode as s, AppShell as t, useKreia as u };
