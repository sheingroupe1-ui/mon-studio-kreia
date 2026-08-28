import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { T as ArrowRight, g as Folder, l as Palette, t as Users, u as Lock, x as Clapperboard } from "../_libs/lucide-react.mjs";
import { a as useKreia, n as Button, r as Mark, t as AppShell } from "./store-jieHu2MF.mjs";
import { n as formatDuration } from "./frames-hdJ0P3Qu.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BxzvhbUZ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var STEPS = [
	{
		n: "01",
		title: "Ajouter la vidéo",
		body: "Importez un fichier. Les liens TikTok sont acceptés, mais l'import reste la méthode fiable."
	},
	{
		n: "02",
		title: "Choisir le type",
		body: "Histoire humaine, Fruit humanoïde ou Anges. Le moteur identifie chaque personnage selon son type réel."
	},
	{
		n: "03",
		title: "Vérifier l'analyse",
		body: "Corrigez ce qui est faux avant toute génération. Rien n'est inventé pour combler les blancs."
	},
	{
		n: "04",
		title: "Générer le plan",
		body: "Hook, bible personnages, style verrouillé, scènes et prompts vidéo prêts à coller."
	}
];
function Home() {
	const hydrate = useKreia((s) => s.hydrate);
	const index = useKreia((s) => s.index);
	const hydrated = useKreia((s) => s.hydrated);
	(0, import_react.useEffect)(() => {
		hydrate();
	}, [hydrate]);
	const recent = hydrated ? index.slice(0, 3) : [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "stagger-in",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "letterbox relative overflow-hidden rounded-[32px] bg-[var(--bg-elevated)] shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "title-card absolute inset-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative grid items-center gap-10 px-6 py-14 sm:px-10 sm:py-16 lg:grid-cols-[minmax(10rem,0.7fr)_minmax(0,1.15fr)] lg:gap-14 lg:px-14 lg:py-20",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mx-auto flex size-[min(52vw,13.5rem)] items-center justify-center sm:size-56",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, { className: "size-full" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--champagne)]",
							children: "Studio créatif"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-4 font-display text-[clamp(3rem,7vw,5.4rem)] leading-[0.88] tracking-[-0.035em]",
							children: "KREIA Studio"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-5 max-w-md font-display text-2xl leading-snug text-[var(--fg-muted)]",
							children: "De la vidéo au plan de production."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 max-w-lg text-base leading-relaxed text-[var(--fg-muted)]",
							children: "KREIA Studio ne résume pas. Il lit ce qui est raconté, comment c'est filmé, et à quoi ça ressemble — puis reconstruit un projet exploitable, scène par scène, sans trahir le style."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-8 flex flex-wrap gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									asChild: true,
									size: "lg",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
										to: "/new",
										children: ["Reconstruire une vidéo", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									asChild: true,
									variant: "outline",
									size: "lg",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
										to: "/idea",
										children: ["Partir d'une idée", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									asChild: true,
									variant: "outline",
									size: "lg",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
										to: "/projects",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Folder, { className: "size-4" }), "Mes projets"]
									})
								})
							]
						})
					] })]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center gap-3 rounded-[20px] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--fg-muted)] shadow-[var(--shadow-border)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clapperboard, { className: "size-4 shrink-0 text-[var(--accent)]" }), "Hook, structure, langage de caméra"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center gap-3 rounded-[20px] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--fg-muted)] shadow-[var(--shadow-border)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-4 shrink-0 text-[var(--accent)]" }), "Character ID verrouillés d'une scène à l'autre"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center gap-3 rounded-[20px] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--fg-muted)] shadow-[var(--shadow-border)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Palette, { className: "size-4 shrink-0 text-[var(--accent)]" }), "Style visuel traité comme une contrainte"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center gap-3 rounded-[20px] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--fg-muted)] shadow-[var(--shadow-border)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "size-4 shrink-0 text-[var(--accent)]" }), "Observé, déduit et proposé restent séparés"]
					})
				]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			className: "mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
			children: STEPS.map((step) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "rounded-[24px] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-border)] transition-transform duration-200 ease-out hover:-translate-y-0.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-xs text-[var(--champagne)]",
						children: step.n
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-2 font-display text-xl",
						children: step.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm leading-relaxed text-[var(--fg-muted)]",
						children: step.body
					})
				]
			}, step.n))
		}),
		recent.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-14",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 flex items-end justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl",
					children: "Projets récents"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/projects",
					className: "text-sm text-[var(--accent)]",
					children: "Tout voir"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-3 sm:grid-cols-3",
				children: recent.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/projects/$id",
					params: { id: p.id },
					className: "rounded-[24px] bg-[var(--bg-elevated)] p-2 no-underline shadow-[var(--shadow-border)] transition-transform duration-200 ease-out hover:-translate-y-0.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overflow-hidden rounded-[16px] bg-[var(--bg-subtle)]",
						children: p.thumbnailDataUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: p.thumbnailDataUrl,
							alt: "",
							className: "aspect-video w-full object-cover outline outline-1 -outline-offset-1 outline-white/10"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex aspect-video items-center justify-center text-[var(--fg-subtle)]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clapperboard, { className: "size-6" })
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "px-3 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-sm text-[var(--fg)]",
							children: p.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-[var(--fg-subtle)]",
							children: formatDuration(p.durationSeconds)
						})]
					})]
				}, p.id))
			})]
		}) : null
	] });
}
//#endregion
export { Home as component };
