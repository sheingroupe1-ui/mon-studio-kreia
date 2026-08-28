import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as require_jsx_runtime, f as useRouterState, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as createId } from "./ids-ckhly8rN.mjs";
import { g as Folder, s as Plus } from "../_libs/lucide-react.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
import { t as create } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/store-jieHu2MF.js
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
	createDraft: async ({ kind, mode, video, frames, thumbnailDataUrl, userNotes, userBrief }) => {
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
			userNotes,
			userBrief
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
			errorMessage: void 0,
			analysisIncomplete: false,
			analysisCheckpoint: void 0
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
export { useKreia as a, cn as i, Button as n, Mark as r, AppShell as t };
