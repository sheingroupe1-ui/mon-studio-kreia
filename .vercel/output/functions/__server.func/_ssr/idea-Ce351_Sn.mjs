import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as require_jsx_runtime, b as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as ideaSceneCount, i as defaultIdeaDuration } from "./duration-CgP428Xm.mjs";
import { t as VISUAL_STYLE_REGISTRY } from "./visual-styles-BkOrGZiu.mjs";
import { i as ideaProgressAt } from "./idea-stages-B8S5HdAV.mjs";
import { D as Apple, d as LoaderCircle, m as ImagePlus, n as User, v as Feather } from "../_libs/lucide-react.mjs";
import { a as useKreia, i as cn, n as Button, t as AppShell } from "./store-jieHu2MF.mjs";
import { d as userFacingError, n as Input, r as Textarea, t as AnalysisProgressView, u as runKreiaJob } from "./job-client-CQEEGWOt.mjs";
import { n as KIND_REGISTRY } from "./kinds-BdI3El3n.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/idea-Ce351_Sn.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
async function runIdeaProject(input) {
	const durationSeconds = input.durationSeconds && input.durationSeconds > 0 ? input.durationSeconds : defaultIdeaDuration(input.idea);
	const sceneCount = ideaSceneCount(durationSeconds);
	input.onProgress(ideaProgressAt(input.checkpoint ? input.checkpoint.phase : "understand"));
	const payload = {
		kind: input.kind,
		idea: input.idea.trim(),
		extras: input.extras.trim() || void 0,
		durationSeconds,
		sceneCount,
		direction: input.direction,
		chosenStyleId: input.chosenStyleId,
		chosenStyleText: input.chosenStyleText,
		styleImageDataUrl: input.styleImageDataUrl,
		userNotes: [input.idea.trim(), input.extras.trim()].filter(Boolean).join("\n"),
		checkpoint: input.checkpoint
	};
	const result = await runKreiaJob("ideate", payload, input.onProgress);
	if (!result.ok) return {
		ok: false,
		error: result.error || "La construction du projet a échoué.",
		checkpoint: result.checkpoint ?? input.checkpoint,
		failedPhase: void 0
	};
	if (!result.analysis) return {
		ok: false,
		error: "Le projet n'a pas pu être lu. Réessayez.",
		checkpoint: input.checkpoint
	};
	return {
		ok: true,
		analysis: result.analysis,
		production: result.production,
		durationSeconds,
		sceneCount
	};
}
var DURATIONS = [
	{
		id: 30,
		label: "30 secondes"
	},
	{
		id: 60,
		label: "1 minute"
	},
	{
		id: 120,
		label: "2 minutes"
	},
	{
		id: 180,
		label: "3 minutes"
	}
];
var DIRECTIONS = [
	{
		id: "strict",
		label: "Respect strict de mon idée",
		body: "Ne complète que l'indispensable. Les détails fournis restent intacts."
	},
	{
		id: "balanced",
		label: "Mode équilibré",
		body: "Respecte l'idée et complète intelligemment ce qui manque."
	},
	{
		id: "develop",
		label: "Laisser KREIA développer",
		body: "Enrichit l'histoire, les scènes et les rebondissements sans trahir le départ."
	}
];
function IdeaProject() {
	const navigate = useNavigate();
	const createDraft = useKreia((s) => s.createDraft);
	const setAnalysis = useKreia((s) => s.setAnalysis);
	const setProduction = useKreia((s) => s.setProduction);
	const imageRef = (0, import_react.useRef)(null);
	const [step, setStep] = (0, import_react.useState)(1);
	const [kind, setKind] = (0, import_react.useState)("human");
	const [idea, setIdea] = (0, import_react.useState)("");
	const [duration, setDuration] = (0, import_react.useState)(null);
	const [customDuration, setCustomDuration] = (0, import_react.useState)("");
	const [styleId, setStyleId] = (0, import_react.useState)(null);
	const [styleText, setStyleText] = (0, import_react.useState)("");
	const [styleImage, setStyleImage] = (0, import_react.useState)(null);
	const [direction, setDirection] = (0, import_react.useState)("balanced");
	const [extras, setExtras] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [progress, setProgress] = (0, import_react.useState)(null);
	const [ideaCheckpoint, setIdeaCheckpoint] = (0, import_react.useState)(void 0);
	const resolvedDuration = duration ?? (customDuration ? Number.parseInt(customDuration, 10) || null : null);
	const previewDuration = resolvedDuration && resolvedDuration > 0 ? resolvedDuration : defaultIdeaDuration(idea);
	const previewScenes = ideaSceneCount(previewDuration);
	async function onPickImage(file) {
		if (!file || !file.type.startsWith("image/")) return;
		const url = URL.createObjectURL(file);
		try {
			const img = new Image();
			img.src = url;
			await new Promise((resolve, reject) => {
				img.onload = resolve;
				img.onerror = reject;
			});
			const canvas = document.createElement("canvas");
			const scale = Math.min(1, 720 / Math.max(img.width, img.height));
			canvas.width = Math.max(1, Math.round(img.width * scale));
			canvas.height = Math.max(1, Math.round(img.height * scale));
			const ctx = canvas.getContext("2d");
			if (!ctx) return;
			ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
			setStyleImage(canvas.toDataURL("image/jpeg", .72));
		} finally {
			URL.revokeObjectURL(url);
		}
	}
	async function build(resume) {
		if (idea.trim().length < 8) {
			setError("Racontez au moins quelques mots : c'est le seul champ obligatoire.");
			return;
		}
		setBusy(true);
		setError(null);
		try {
			const result = await runIdeaProject({
				kind,
				idea,
				extras,
				durationSeconds: resolvedDuration,
				direction,
				chosenStyleId: styleId ?? void 0,
				chosenStyleText: styleId === "custom" ? styleText : void 0,
				styleImageDataUrl: styleImage,
				checkpoint: resume,
				onProgress: setProgress
			});
			if (!result.ok) {
				setIdeaCheckpoint(result.checkpoint);
				throw new Error(result.error);
			}
			const title = idea.trim().split(/\s+/).slice(0, 8).join(" ") || "Projet d'idée";
			const project = await createDraft({
				kind,
				mode: "inspiration",
				video: {
					durationSeconds: result.durationSeconds,
					width: 1920,
					height: 1080,
					fileName: title,
					source: "file"
				},
				frames: [],
				userNotes: [idea.trim(), extras.trim()].filter(Boolean).join("\n")
			});
			await setAnalysis(result.analysis);
			if (result.production) await setProduction(result.production);
			toast.success(result.production ? `Projet prêt — ${result.sceneCount} scènes d'environ 10 secondes.` : "Histoire prête. Générez ensuite le plan de production.");
			await navigate({
				to: "/projects/$id",
				params: { id: project.id }
			});
		} catch (err) {
			const message = userFacingError(err, "La construction du projet a échoué.");
			setError(message.replace(/vidéo/gi, "idée"));
			toast.error(message.replace(/vidéo/gi, "idée"));
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-3xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--champagne)]",
				children: "Partir d'une idée"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 font-display text-4xl tracking-[-0.03em] sm:text-5xl",
				children: {
					1: "Univers de l'histoire",
					2: "Racontez votre idée",
					3: "Durée souhaitée",
					4: "Style visuel",
					5: "Direction créative",
					6: "Précisions"
				}[step]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-sm text-[var(--fg-muted)]",
				children: [
					"Étape ",
					step,
					" / 6 · seule l'idée est obligatoire"
				]
			}),
			step === 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8 grid gap-3 sm:grid-cols-3",
				children: KIND_REGISTRY.map((item) => {
					const Icon = item.id === "human" ? User : item.id === "angel" ? Feather : Apple;
					const selected = kind === item.id;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setKind(item.id),
						className: cn("rounded-[24px] p-5 text-left shadow-[var(--shadow-border)]", selected ? "bg-[var(--accent-fill)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--accent)_40%,transparent)]" : "bg-[var(--bg-elevated)]"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mt-3 font-display text-2xl",
								children: item.label
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-[var(--fg-muted)]",
								children: item.description
							})
						]
					}, item.id);
				})
			}) : null,
			step === 2 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]",
					children: ["Racontez votre idée ou votre histoire", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
						className: "mt-2 min-h-40",
						value: idea,
						onChange: (e) => setIdea(e.target.value),
						placeholder: "Décrivez votre idée, votre histoire, les personnages que vous imaginez, ce qui doit se passer ou tout autre élément important."
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-[var(--fg-subtle)]",
					children: "Quelques lignes suffisent. KREIA complète ce qui manque et respecte ce que vous précisez."
				})]
			}) : null,
			step === 3 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-[var(--fg-muted)]",
						children: "Facultatif. Chaque scène fait environ 10 secondes."
					}),
					DURATIONS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => {
							setDuration(item.id);
							setCustomDuration("");
						},
						className: cn("w-full rounded-[20px] px-4 py-4 text-left shadow-[var(--shadow-border)]", duration === item.id ? "bg-[var(--accent-fill)]" : "bg-[var(--bg-elevated)]"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium",
							children: item.label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-sm text-[var(--fg-muted)]",
							children: [ideaSceneCount(item.id), " scènes"]
						})]
					}, item.id)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-[20px] bg-[var(--bg-elevated)] p-4 shadow-[var(--shadow-border)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium",
							children: "Durée personnalisée"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-2",
							inputMode: "numeric",
							value: customDuration,
							placeholder: "Secondes, ex. 90",
							onChange: (e) => {
								setCustomDuration(e.target.value.replace(/[^\d]/g, ""));
								setDuration(null);
							}
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-[var(--fg-subtle)]",
						children: [
							"Sans choix, KREIA proposera environ ",
							previewDuration,
							"s (",
							previewScenes,
							" scènes)."
						]
					})
				]
			}) : null,
			step === 4 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-[var(--fg-muted)]",
						children: "Facultatif. Sinon KREIA choisit un style cohérent."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid gap-2 sm:grid-cols-2",
						children: VISUAL_STYLE_REGISTRY.map((item) => {
							const selected = styleId === item.id;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setStyleId(item.id),
								className: cn("rounded-[20px] px-4 py-4 text-left shadow-[var(--shadow-border)]", selected ? "bg-[var(--accent-fill)]" : "bg-[var(--bg-elevated)]"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-medium",
									children: item.label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-[var(--fg-muted)]",
									children: item.description
								})]
							}, item.id);
						})
					}),
					styleId === "custom" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]",
						children: ["Style personnalisé", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							className: "mt-2",
							value: styleText,
							onChange: (e) => setStyleText(e.target.value),
							placeholder: "Décrivez le rendu souhaité..."
						})]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-[20px] bg-[var(--bg-elevated)] p-4 shadow-[var(--shadow-border)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-medium",
								children: "Image d'inspiration"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-[var(--fg-muted)]",
								children: "Facultatif. Ambiance et lumière seulement."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								ref: imageRef,
								type: "file",
								accept: "image/*",
								className: "hidden",
								onChange: (e) => void onPickImage(e.target.files?.[0] ?? null)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									type: "button",
									variant: "outline",
									onClick: () => imageRef.current?.click(),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { className: "size-4" }), "Ajouter une image"]
								}), styleImage ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									variant: "ghost",
									onClick: () => setStyleImage(null),
									children: "Retirer"
								}) : null]
							}),
							styleImage ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: styleImage,
								alt: "Inspiration",
								className: "mt-3 h-24 w-40 rounded-[12px] object-cover"
							}) : null
						]
					})
				]
			}) : null,
			step === 5 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8 grid gap-3",
				children: DIRECTIONS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setDirection(item.id),
					className: cn("rounded-[20px] px-4 py-4 text-left shadow-[var(--shadow-border)]", direction === item.id ? "bg-[var(--accent-fill)]" : "bg-[var(--bg-elevated)]"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium",
						children: item.label
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-[var(--fg-muted)]",
						children: item.body
					})]
				}, item.id))
			}) : null,
			step === 6 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 space-y-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]",
						children: ["Précisions supplémentaires", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							className: "mt-2",
							value: extras,
							onChange: (e) => setExtras(e.target.value),
							placeholder: "Ajoutez tout ce que vous souhaitez préciser à KREIA Studio..."
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
						className: "grid gap-3 rounded-[24px] bg-[var(--bg-elevated)] p-5 text-sm shadow-[var(--shadow-border)] sm:grid-cols-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-[var(--fg-subtle)]",
								children: "Univers"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: KIND_REGISTRY.find((k) => k.id === kind)?.label })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-[var(--fg-subtle)]",
								children: "Durée"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: [
								previewDuration,
								"s · ",
								previewScenes,
								" scènes"
							] })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-[var(--fg-subtle)]",
								children: "Style"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: styleId ? VISUAL_STYLE_REGISTRY.find((s) => s.id === styleId)?.label : "Choisi par KREIA" })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-[var(--fg-subtle)]",
								children: "Direction"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: DIRECTIONS.find((d) => d.id === direction)?.label })] })
						]
					}),
					progress ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnalysisProgressView, {
						progress,
						mode: "idea"
					}) : null
				]
			}) : null,
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 space-y-3 rounded-[var(--radius-md)] bg-[color-mix(in_oklab,var(--color-danger)_14%,transparent)] px-4 py-3 text-sm text-[#f3c7bf]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: error }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "outline",
						disabled: busy,
						onClick: () => void build(ideaCheckpoint),
						children: "Réessayer cette étape"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "ghost",
						disabled: busy,
						onClick: () => {
							setError(null);
							setProgress(null);
							setStep(2);
						},
						children: "Modifier mon idée"
					})]
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 flex flex-wrap items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "ghost",
					disabled: busy,
					onClick: () => {
						if (step === 1) {
							navigate({ to: "/new" });
							return;
						}
						setStep((s) => s - 1);
					},
					children: "Retour"
				}), step < 6 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					disabled: step === 2 && idea.trim().length < 8,
					onClick: () => setStep((s) => s + 1),
					children: "Continuer"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					disabled: busy || idea.trim().length < 8,
					onClick: () => void build(),
					children: busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), "Construction…"] }) : "Construire mon projet"
				})]
			})
		]
	}) });
}
//#endregion
export { IdeaProject as component };
