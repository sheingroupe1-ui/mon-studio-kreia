import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Trash2, s as Plus, x as Clapperboard } from "../_libs/lucide-react.mjs";
import { a as useKreia, n as Button, t as AppShell } from "./store-jieHu2MF.mjs";
import { i as kindById } from "./kinds-BdI3El3n.mjs";
import { n as formatDuration } from "./frames-hdJ0P3Qu.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/projects.index-B-E6QeZd.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var STATUS = {
	draft: "Brouillon",
	analyzing: "Analyse",
	"analysis-ready": "À valider",
	generating: "Génération",
	complete: "Plan prêt",
	incomplete: "Incomplète"
};
function ProjectsPage() {
	const hydrate = useKreia((s) => s.hydrate);
	const index = useKreia((s) => s.index);
	const hydrated = useKreia((s) => s.hydrated);
	const remove = useKreia((s) => s.remove);
	(0, import_react.useEffect)(() => {
		hydrate();
	}, [hydrate]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-wrap items-end justify-between gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--champagne)]",
			children: "Archives"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "mt-1 font-display text-4xl",
			children: "Mes projets"
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/new",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "Nouveau"]
			})
		})]
	}), !hydrated ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mt-10 text-sm text-[var(--fg-muted)]",
		children: "Chargement…"
	}) : index.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-12 overflow-hidden rounded-[28px] bg-[var(--bg-elevated)] px-6 py-20 text-center shadow-[var(--shadow-border)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clapperboard, { className: "mx-auto size-8 text-[var(--accent)]" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 font-display text-3xl",
				children: "Aucun projet pour l'instant"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mx-auto mt-2 max-w-md text-sm text-[var(--fg-muted)]",
				children: "Importez une vidéo de référence pour produire votre premier plan."
			})
		]
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
		children: index.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "rounded-[24px] bg-[var(--bg-elevated)] p-2 shadow-[var(--shadow-border)] transition-transform duration-200 ease-out hover:-translate-y-0.5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/projects/$id",
				params: { id: p.id },
				className: "block no-underline",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-hidden rounded-[16px] bg-[var(--bg-subtle)]",
					children: p.thumbnailDataUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: p.thumbnailDataUrl,
						alt: "",
						className: "aspect-[16/9] w-full object-cover outline outline-1 -outline-offset-1 outline-white/10"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex aspect-[16/9] items-center justify-center text-[var(--fg-subtle)]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clapperboard, { className: "size-7" })
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "px-3 pt-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate font-medium text-[var(--fg)]",
						children: p.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-xs text-[var(--fg-subtle)]",
						children: [
							kindById(p.kind).label,
							" · ",
							formatDuration(p.durationSeconds),
							" ·",
							" ",
							STATUS[p.status] ?? p.status
						]
					})]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-end px-1 pb-1",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "sm",
					"aria-label": "Supprimer",
					onClick: () => void remove(p.id),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
				})
			})]
		}, p.id))
	})] });
}
//#endregion
export { ProjectsPage as component };
