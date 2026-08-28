import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as require_jsx_runtime, b as useNavigate, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { L as swatchForCharacter, _ as enforceProductionDialogues, k as matchCharacter, p as dialogueCharCount } from "./cast-edit-B0U-aGNG.mjs";
import { E as ArrowLeft, b as Copy, c as Pencil, d as LoaderCircle, w as Check, y as Download } from "../_libs/lucide-react.mjs";
import { a as useKreia, i as cn, n as Button, t as AppShell } from "./store-jieHu2MF.mjs";
import { c as logKreiaError, d as userFacingError, i as failMessage, r as Textarea, s as logKreia, t as AnalysisProgressView, u as runKreiaJob } from "./job-client-CQEEGWOt.mjs";
import { a as modeById, i as kindById } from "./kinds-BdI3El3n.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as toAnalysisFrames, n as formatDuration, r as formatTimecode } from "./frames-hdJ0P3Qu.mjs";
import { a as Field, i as DialogueBoard, n as CharacterCast, o as PromptBlock, r as ConfidenceBadge, s as SectionCard, t as Badge } from "./dialogue-board-CbpxrFUT.mjs";
import { n as Route } from "./router-CtchSUdg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/projects._id-Cz2usbek.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CopyButton({ text, label = "Copier", className }) {
	const [copied, setCopied] = (0, import_react.useState)(false);
	async function onCopy() {
		if (!text) return;
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			const el = document.createElement("textarea");
			el.value = text;
			document.body.appendChild(el);
			el.select();
			document.execCommand("copy");
			document.body.removeChild(el);
		}
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1600);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
		type: "button",
		variant: "outline",
		size: "sm",
		onClick: onCopy,
		className: cn("min-w-[6.5rem]", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "relative inline-flex size-4 items-center justify-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: cn("absolute transition-[opacity,transform,filter] duration-300", copied ? "scale-[0.25] opacity-0 blur-[4px]" : "scale-100 opacity-100 blur-0") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: cn("absolute transition-[opacity,transform,filter] duration-300", copied ? "scale-100 opacity-100 blur-0" : "scale-[0.25] opacity-0 blur-[4px]") })]
		}), copied ? "Copié" : label]
	});
}
function AnalysisView({ project, onEdit, onAnalysisChange }) {
	const analysis = project.analysis;
	if (!analysis) return null;
	const kind = kindById(project.kind);
	const mode = modeById(project.mode);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SectionCard, {
				kicker: "Lecture",
				title: "Ce qui a été observé",
				action: onEdit ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "outline",
					size: "sm",
					onClick: () => onEdit("analysis"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "size-3.5" }), "Corriger"]
				}) : null,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm leading-relaxed text-[var(--fg)]",
						children: analysis.observedSummary
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-xs text-[var(--fg-subtle)]",
						children: [
							"Durée source ",
							formatDuration(project.video.durationSeconds),
							" · ",
							analysis.scenes.length,
							" ",
							analysis.scenes.length > 1 ? "scènes" : "scène",
							" ·",
							" ",
							analysis.scenes.reduce((n, s) => n + s.estimatedDuration, 0),
							" s de prompts"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: "gold",
								children: kind.label
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: mode.label }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: "muted",
								children: analysis.narrative.genre || "Genre non identifié"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: "muted",
								children: analysis.narrative.tone || "Ton non identifié"
							})
						]
					}),
					analysis.limitations.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 rounded-[var(--radius-md)] bg-[var(--bg)] px-4 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]",
							children: "Limites de l'observation"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-2 space-y-1 text-sm text-[var(--fg-muted)]",
							children: analysis.limitations.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["— ", item] }, item))
						})]
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SectionCard, {
				kicker: "Structure",
				title: "Histoire",
				action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfidenceBadge, { value: analysis.narrative.confidence }),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4 sm:grid-cols-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Sujet",
							value: analysis.narrative.subject
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Contexte",
							value: analysis.narrative.context
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Situation initiale",
							value: analysis.narrative.initialSituation
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Événement déclencheur",
							value: analysis.narrative.incitingIncident
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Conflit",
							value: analysis.narrative.conflict
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Enjeux",
							value: analysis.narrative.stakes
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Climax",
							value: analysis.narrative.climax
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Résolution",
							value: analysis.narrative.resolution
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Récit",
						value: analysis.narrative.story
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionCard, {
				kicker: "Premières secondes",
				title: "Hook original",
				action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfidenceBadge, { value: analysis.hook.confidence }),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4 sm:grid-cols-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Ce qui se passe",
							value: analysis.hook.firstSecondsDescription
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Mécanisme d'attention",
							value: analysis.hook.attentionMechanism
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Information révélée",
							value: analysis.hook.revealedInfo
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Conflit introduit",
							value: analysis.hook.introducedConflict
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Curiosité créée",
							value: analysis.hook.curiosityCreated
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Pourquoi continuer",
							value: analysis.hook.whyContinue
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionCard, {
				kicker: "Continuité",
				title: "Personnages",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CharacterCast, {
					characters: analysis.characters,
					kind: project.kind,
					onChange: (characters) => onAnalysisChange?.({
						...analysis,
						characters: characters.map((c) => ({
							...c,
							userLocked: true
						}))
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SectionCard, {
				kicker: "Choix de production",
				title: "Style visuel",
				action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfidenceBadge, { value: analysis.visualStyle.confidence }),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-2xl text-[var(--champagne)]",
					children: analysis.visualStyle.lockedStylePhrase || "Style non verrouillé"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 grid gap-4 sm:grid-cols-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Rendu",
							value: analysis.visualStyle.renderType
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Style artistique",
							value: analysis.visualStyle.artisticStyle
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Apparence des personnages",
							value: analysis.visualStyle.characterAppearance
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Éclairage",
							value: analysis.visualStyle.lighting
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Palette",
							value: analysis.visualStyle.colorPalette.join(" · ")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Atmosphère",
							value: analysis.visualStyle.atmosphere
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Caméra",
							value: analysis.visualStyle.cameraMovement
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Rythme",
							value: analysis.visualStyle.pace
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SectionCard, {
				kicker: "Audio",
				title: "Piste sonore",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
								tone: analysis.audio.dialoguePresent ? "ok" : "muted",
								children: ["Dialogue ", analysis.audio.dialoguePresent ? "présent" : "non observé"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: analysis.audio.voiceOverPresent ? "ok" : "muted",
								children: "Voix off"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: analysis.audio.musicPresent ? "ok" : "muted",
								children: "Musique"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: analysis.audio.ambiencePresent ? "ok" : "muted",
								children: "Ambiance"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: analysis.audio.sfxPresent ? "ok" : "muted",
								children: "Bruitages"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid gap-4 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Source",
							value: analysis.audio.source
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Rythme",
							value: analysis.audio.rhythm
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Notes",
							value: analysis.audio.notes
						})
					}),
					analysis.audio.transcriptExcerpt ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Extrait de transcription",
							value: analysis.audio.transcriptExcerpt
						})
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionCard, {
				kicker: "Paroles",
				title: "Dialogues verrouillés",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogueBoard, {
					analysis,
					onChange: onAnalysisChange
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionCard, {
				kicker: "Découpage",
				title: `${analysis.scenes.length} scène${analysis.scenes.length > 1 ? "s" : ""}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-3",
					children: analysis.scenes.map((scene) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "rounded-[var(--radius-lg)] bg-[var(--bg)] p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
									className: "font-display text-xl",
									children: ["Scène ", String(scene.number).padStart(2, "0")]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
											tone: "gold",
											children: [
												"~",
												Math.round(scene.estimatedDuration),
												" s"
											]
										}),
										scene.startHint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											tone: "muted",
											children: scene.startHint
										}) : null,
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfidenceBadge, { value: scene.confidence })
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 grid gap-3 sm:grid-cols-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Lieu",
										value: scene.setting
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Caméra",
										value: scene.camera
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Action",
										value: scene.action
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Émotion",
										value: scene.emotion
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Personnages",
										value: scene.characters.join(", "),
										empty: "Aucun identifié"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Audio",
										value: scene.audio
									})
								]
							}),
							scene.silentReactions?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 space-y-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]",
									children: "Personnages silencieux"
								}), scene.silentReactions.map((reaction) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm text-[var(--fg-muted)]",
									children: [
										reaction.characterLabel || reaction.characterId,
										" — ",
										[
											reaction.expression,
											reaction.gaze,
											reaction.gesture,
											reaction.posture
										].filter(Boolean).join(" · ") || "présent, sans parole"
									]
								}, `${reaction.characterId}-${reaction.expression}`))]
							}) : null,
							scene.dialogue ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] px-3 py-2 text-sm italic",
								children: [scene.dialogueSpeaker ? `${scene.dialogueSpeaker} : ` : "", scene.dialogue]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-xs text-[var(--fg-subtle)]",
								children: "Aucun dialogue observé dans cette scène."
							})
						]
					}, scene.number))
				})
			}),
			project.frames.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SectionCard, {
				kicker: "Matériau",
				title: "Photogrammes extraits",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4",
					children: project.frames.map((frame) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: frame.dataUrl,
						alt: "",
						className: "aspect-video w-full rounded-[var(--radius-md)] object-cover outline outline-1 -outline-offset-1 outline-white/10"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("figcaption", {
						className: "mt-1.5 font-mono text-[10px] text-[var(--fg-subtle)]",
						children: formatTimecode(frame.t)
					})] }, frame.t))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 flex justify-end",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyButton, {
						text: analysis.observedSummary,
						label: "Copier le résumé"
					})
				})]
			}) : null
		]
	});
}
function kindByIdSafe(kind) {
	try {
		return kindById(kind).label;
	} catch {
		return kind;
	}
}
function block(title, body) {
	return `## ${title}\n\n${body.trim()}\n`;
}
function projectToMarkdown(project) {
	const a = project.analysis;
	const p = project.production;
	const lines = [
		`# ${project.title}`,
		"",
		`- Type : ${kindByIdSafe(project.kind)}`,
		`- Mode : ${project.mode}`,
		`- Durée source : ${project.video.durationSeconds.toFixed(1)} s`,
		""
	];
	if (a) {
		lines.push(block("Analyse — résumé observé", `${a.observedSummary}\n\nLimitations : ${a.limitations.join(" ; ") || "aucune"}`), block("Hook original", a.hook.firstSecondsDescription), block("Style visuel verrouillé", `${a.visualStyle.lockedStylePhrase}\n${a.visualStyle.artisticStyle}`));
		for (const c of a.characters) lines.push(block(`${c.id} — ${c.designation}`, [
			c.name ? `Nom : ${c.name}` : null,
			`Rôle : ${c.role}`,
			`Apparence : ${c.appearance}`,
			`Vêtements : ${c.clothing}`
		].filter(Boolean).join("\n")));
	}
	if (p) {
		lines.push(block("Hook reconstruit", p.hook.reconstructed), block("Prompt hook", p.hook.visualPrompt), block("Logline", p.scenario.logline), block("Synopsis", p.scenario.synopsis));
		for (const c of p.characters) lines.push(block(`Fiche ${c.id}`, c.bible), block(`Prompt image ${c.id}`, c.imagePrompt));
		lines.push(block("Style de production", `${p.visualStyle.lockedPhrase}\n${p.visualStyle.productionNotes}`));
		for (const s of p.scenes) lines.push(block(`Scène ${String(s.number).padStart(2, "0")} (${s.duration}s)`, [
			`Lieu : ${s.location}`,
			`Action : ${s.action}`,
			`Caméra : ${s.camera}`,
			`Audio : ${s.audio}`,
			s.dialogue ? `Dialogue source : ${s.dialogue}` : "Dialogue : aucun",
			"",
			"Prompt vidéo :",
			s.videoPrompt
		].join("\n")));
	}
	return lines.join("\n");
}
function downloadText(filename, content) {
	const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}
var SECTIONS = [
	{
		id: "hook",
		label: "Hook"
	},
	{
		id: "scenario",
		label: "Histoire"
	},
	{
		id: "characters",
		label: "Personnages"
	},
	{
		id: "scenes",
		label: "Scènes"
	}
];
function ProductionView({ project, onEdit }) {
	const plan = project.production;
	if (!plan) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
				className: "sticky top-16 z-20 -mx-4 flex gap-2 overflow-x-auto bg-[color-mix(in_oklab,var(--bg)_88%,transparent)] px-4 py-3 backdrop-blur-md sm:mx-0 sm:rounded-[var(--radius-lg)] sm:px-3",
				children: [SECTIONS.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: `#${s.id}`,
					className: "shrink-0 rounded-full px-3 py-2 text-sm text-[var(--fg-muted)] shadow-[inset_0_0_0_1px_var(--border)] hover:text-[var(--fg)]",
					children: s.label
				}, s.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "ml-auto shrink-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						size: "sm",
						onClick: () => downloadText(`${project.title.replace(/\s+/g, "-").toLowerCase()}.md`, projectToMarkdown(project)),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-3.5" }), "Exporter"]
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SectionCard, {
				id: "hook",
				kicker: "01",
				title: "Hook reconstruit",
				action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
							tone: "gold",
							children: [plan.hook.duration, " s"]
						}),
						onEdit ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							size: "sm",
							onClick: () => onEdit("hook"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "size-3.5" }), "Modifier"]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyButton, { text: plan.hook.visualPrompt })
					]
				}),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-2xl leading-snug text-[var(--fg)]",
						children: plan.hook.reconstructed
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-[var(--fg-muted)]",
						children: plan.hook.mechanism
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]",
							children: "Prompt visuel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PromptBlock, { text: plan.hook.visualPrompt })]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SectionCard, {
				id: "scenario",
				kicker: "02",
				title: "Histoire",
				action: onEdit ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "outline",
					size: "sm",
					onClick: () => onEdit("scenario"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "size-3.5" }), "Modifier"]
				}) : null,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Logline",
						value: plan.scenario.logline
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Synopsis",
							value: plan.scenario.synopsis
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Structure",
							value: plan.scenario.structure
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Dialogues",
							value: plan.scenario.dialoguesNote
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionCard, {
				id: "characters",
				kicker: "03",
				title: "Personnages",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-4",
					children: plan.characters.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "rounded-[var(--radius-lg)] bg-[var(--bg)] p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-3 flex flex-wrap items-center justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "font-mono text-sm text-[var(--accent)]",
									children: c.id
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-2",
									children: [onEdit ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "ghost",
										size: "sm",
										onClick: () => onEdit(`character:${c.id}`),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "size-3.5" }), "Modifier"]
									}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyButton, { text: c.imagePrompt })]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Bible de continuité",
								value: c.bible
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]",
									children: "Prompt image de référence"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PromptBlock, { text: c.imagePrompt })]
							})
						]
					}, c.id))
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionCard, {
				id: "scenes",
				kicker: "04",
				title: "Découpage et prompts vidéo",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-4",
					children: plan.scenes.map((scene) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "rounded-[var(--radius-lg)] bg-[var(--bg)] p-4 sm:p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
									className: "font-display text-2xl",
									children: ["Scène ", String(scene.number).padStart(2, "0")]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
											tone: "gold",
											children: [scene.duration, " s"]
										}),
										onEdit ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											variant: "ghost",
											size: "sm",
											onClick: () => onEdit(`scene:${scene.number}`),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "size-3.5" }), "Modifier"]
										}) : null,
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyButton, { text: scene.videoPrompt })
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 grid gap-3 sm:grid-cols-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Personnages",
										value: scene.characters.join(", "),
										empty: "Aucun"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Lieu",
										value: scene.location
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Action",
										value: scene.action
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Émotion",
										value: scene.emotion
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Caméra",
										value: scene.camera
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Éclairage",
										value: scene.lighting
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Style visuel",
										value: scene.visualStyle
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Audio",
										value: scene.audio
									})
								]
							}),
							(() => {
								const lines = (project.analysis?.dialogues?.lines ?? []).filter((l) => l.sceneNumber === scene.number).sort((a, b) => a.order - b.order);
								if (!lines.length && !scene.dialogue) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 text-xs text-[var(--fg-subtle)]",
									children: "Pas de dialogue."
								});
								const total = dialogueCharCount(lines);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]",
										children: [
											"Dialogues source · ",
											total,
											" caractères"
										]
									}), lines.length ? lines.map((line) => {
										const character = matchCharacter(line.speakerId, project.analysis?.characters ?? []);
										const swatch = swatchForCharacter(character, 0);
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] px-3 py-2 text-sm italic",
											style: { boxShadow: `inset 3px 0 0 var(${swatch.cssVar})` },
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "not-italic font-medium text-[var(--fg)]",
													children: line.speakerLabel || "À vérifier"
												}),
												" — ",
												line.displayText || line.sourceText
											]
										}, line.id);
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "whitespace-pre-wrap rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] px-3 py-2 text-sm italic text-[var(--fg)]",
										children: scene.dialogue
									})]
								});
							})(),
							scene.continuityNotes ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 text-xs text-[var(--fg-muted)]",
								children: ["Continuité : ", scene.continuityNotes]
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]",
									children: "Prompt vidéo"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PromptBlock, { text: scene.videoPrompt })]
							})
						]
					}, scene.number))
				})
			})
		]
	});
}
function RevisePanel({ title, placeholder, busy, onSubmit, onClose }) {
	const [value, setValue] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[color-mix(in_oklab,var(--bg)_94%,transparent)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-3xl space-y-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium text-[var(--fg)]",
						children: title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onClose,
						className: "text-sm text-[var(--fg-muted)] hover:text-[var(--fg)]",
						children: "Fermer"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					value,
					onChange: (e) => setValue(e.target.value),
					placeholder,
					rows: 3
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex justify-end gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						type: "button",
						onClick: onClose,
						children: "Annuler"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						disabled: busy || value.trim().length < 4,
						onClick: () => onSubmit(value.trim()),
						children: busy ? "Application…" : "Appliquer"
					})]
				})
			]
		})
	});
}
function ProjectPage() {
	const { id } = Route.useParams();
	const navigate = useNavigate();
	const open = useKreia((s) => s.open);
	const current = useKreia((s) => s.current);
	const patchCurrent = useKreia((s) => s.patchCurrent);
	const setProduction = useKreia((s) => s.setProduction);
	const setAnalysis = useKreia((s) => s.setAnalysis);
	const [tab, setTab] = (0, import_react.useState)("analysis");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [revise, setRevise] = (0, import_react.useState)(null);
	const [progress, setProgress] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		open(id).then((p) => {
			if (!p) {
				toast.error("Projet introuvable.");
				navigate({ to: "/projects" });
				return;
			}
			if (p.production) setTab("plan");
		});
	}, [
		id,
		open,
		navigate
	]);
	if (!current || current.id !== id) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-[var(--fg-muted)]",
		children: "Ouverture du projet…"
	}) });
	async function onGenerate() {
		if (!current?.analysis) return;
		const unverified = (current.analysis.dialogues?.lines ?? []).filter((l) => l.attribution === "unverified" || !l.speakerId);
		if (unverified.length) {
			setTab("analysis");
			toast.error(`${unverified.length} réplique${unverified.length > 1 ? "s" : ""} sans personnage certain. Attribue-les avant de générer.`);
			return;
		}
		setBusy(true);
		setProgress({
			step: 7,
			total: 7,
			label: "Préparation de votre projet"
		});
		await patchCurrent({ status: "generating" });
		try {
			logKreia("generate:start", {
				id: current.id,
				kind: current.kind
			});
			const result = await runKreiaJob("generate", {
				analysis: current.analysis,
				kind: current.kind,
				mode: current.mode,
				userNotes: current.userNotes,
				durationSeconds: current.video.durationSeconds
			}, setProgress);
			if (!result.ok) {
				const message = failMessage(result, "Le plan de production n'a pas pu être lu. Réessayez.");
				await patchCurrent({
					status: "analysis-ready",
					errorMessage: message
				});
				toast.error(message);
				return;
			}
			await setProduction(result.production);
			setTab("plan");
			toast.success("Plan de production généré.");
		} catch (err) {
			logKreiaError("generate:failed", err);
			const message = userFacingError(err, "Le plan de production n'a pas pu être généré. Réessayez.");
			await patchCurrent({
				status: "analysis-ready",
				errorMessage: message
			});
			toast.error(message);
		} finally {
			setBusy(false);
			setProgress(null);
		}
	}
	async function applyRevision(instruction) {
		if (!current) return;
		setBusy(true);
		try {
			if (!current.production || tab === "analysis") {
				if (!current.analysis) return;
				logKreia("revise-analysis:start");
				const result = await runKreiaJob("revise-analysis", {
					analysis: current.analysis,
					instruction,
					kind: current.kind,
					durationSeconds: current.video.durationSeconds
				});
				if (!result.ok) {
					toast.error(failMessage(result, "La correction n'a pas pu être appliquée de façon fiable."));
					return;
				}
				await setAnalysis(result.analysis);
				await patchCurrent({
					analysisEdits: [...current.analysisEdits, instruction],
					production: void 0,
					status: "analysis-ready"
				});
				toast.success("Analyse mise à jour. Le plan devra être régénéré.");
			} else {
				const focus = parseFocus(revise);
				logKreia("revise-production:start");
				const result = await runKreiaJob("revise-production", {
					analysis: current.analysis,
					production: current.production,
					kind: current.kind,
					mode: current.mode,
					instruction,
					durationSeconds: current.video.durationSeconds,
					focus
				});
				if (!result.ok) {
					toast.error(failMessage(result, "La modification n'a pas pu être appliquée de façon fiable."));
					return;
				}
				await setProduction(result.production);
				toast.success("Plan mis à jour.");
			}
			setRevise(null);
		} catch (err) {
			logKreiaError("revise:failed", err);
			toast.error(userFacingError(err, "La correction n'a pas pu être envoyée. Réessayez."));
		} finally {
			setBusy(false);
		}
	}
	async function onAnalysisChange(analysis) {
		if (!current) return;
		const production = current.production ? enforceProductionDialogues(current.production, analysis, current.mode, current.kind) : current.production;
		await patchCurrent({
			analysis,
			production,
			analysisEdits: current.analysisEdits.includes("attribution manuelle") ? current.analysisEdits : [...current.analysisEdits, "attribution manuelle"]
		});
	}
	async function resumeAnalysis(fullRestart) {
		if (!current) return;
		setBusy(true);
		try {
			const frames = await toAnalysisFrames(current.frames);
			const result = await runKreiaJob("analyze", {
				frames,
				durationSeconds: current.video.durationSeconds,
				width: current.video.width,
				height: current.video.height,
				kind: current.kind,
				userNotes: current.userNotes,
				checkpoint: fullRestart ? void 0 : current.analysisCheckpoint
			});
			if (!result.ok) {
				const message = failMessage(result, "Analyse incomplète.");
				await patchCurrent({
					status: result.incomplete ? "incomplete" : "error",
					errorMessage: message,
					analysisCheckpoint: result.checkpoint,
					analysisIncomplete: Boolean(result.incomplete)
				});
				toast.error(message);
				return;
			}
			await setAnalysis(result.analysis);
			toast.success("Analyse prête à vérifier.");
		} catch (err) {
			toast.error(userFacingError(err, "L'analyse n'a pas pu aboutir. Réessayez."));
		} finally {
			setBusy(false);
		}
	}
	const still = current.thumbnailDataUrl || current.frames[0]?.dataUrl;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		still ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mb-6 overflow-hidden rounded-[28px] bg-[var(--bg-elevated)] p-2 shadow-[var(--shadow-border)]",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: still,
				alt: "",
				className: "aspect-[21/9] w-full rounded-[20px] object-cover outline outline-1 -outline-offset-1 outline-white/10"
			})
		}) : null,
		current.status === "incomplete" || current.analysisIncomplete ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-6 rounded-[var(--radius-lg)] bg-[color-mix(in_oklab,var(--color-danger)_12%,transparent)] px-4 py-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-xl",
					children: "Analyse incomplète."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-[var(--fg-muted)]",
					children: current.errorMessage || (current.analysisCheckpoint?.failedMessage ?? "Une étape n'a pas pu aboutir. Vous pouvez reprendre sans tout recommencer.")
				}),
				current.analysisCheckpoint?.analyzedSegmentCount ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-xs text-[var(--fg-subtle)]",
					children: ["Segments analysés : ", current.analysisCheckpoint.analyzedSegmentCount]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						type: "button",
						disabled: busy || !current.frames.length,
						onClick: () => void resumeAnalysis(false),
						children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : null, "Reprendre l'analyse"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "outline",
						disabled: busy || !current.frames.length,
						onClick: () => void resumeAnalysis(true),
						children: "Recommencer l'analyse"
					})]
				})
			]
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-6 flex flex-wrap items-start justify-between gap-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/projects",
					className: "inline-flex items-center gap-1 text-sm text-[var(--fg-muted)] no-underline hover:text-[var(--fg)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }), "Mes projets"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-display text-3xl sm:text-4xl",
					children: current.title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-sm text-[var(--fg-subtle)]",
					children: [
						kindById(current.kind).label,
						" · ",
						modeById(current.mode).label,
						" ·",
						" ",
						formatDuration(current.video.durationSeconds)
					]
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [current.analysis ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex rounded-[var(--radius-md)] bg-[var(--bg-elevated)] p-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setTab("analysis"),
						className: `h-9 rounded-[8px] px-3 text-sm ${tab === "analysis" ? "bg-[var(--bg-subtle)]" : "text-[var(--fg-muted)]"}`,
						children: "Analyse"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => current.production && setTab("plan"),
						disabled: !current.production,
						className: `h-9 rounded-[8px] px-3 text-sm ${tab === "plan" ? "bg-[var(--bg-subtle)]" : "text-[var(--fg-muted)]"}`,
						children: "Plan"
					})]
				}) : null, tab === "analysis" && current.analysis ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					disabled: busy,
					onClick: () => void onGenerate(),
					children: busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), "Génération…"] }) : "Générer mon projet"
				}) : null]
			})]
		}),
		current.status === "error" && current.errorMessage ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-5 rounded-[var(--radius-md)] bg-[color-mix(in_oklab,var(--color-danger)_14%,transparent)] px-4 py-3 text-sm text-[#f3c7bf]",
			children: current.errorMessage
		}) : null,
		progress ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mb-5",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnalysisProgressView, { progress })
		}) : null,
		tab === "analysis" && current.analysis ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnalysisView, {
			project: current,
			onEdit: () => setRevise("analysis"),
			onAnalysisChange: (analysis) => void onAnalysisChange(analysis)
		}) : null,
		tab === "plan" && current.production ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductionView, {
			project: current,
			onEdit: (focus) => setRevise(focus)
		}) : null,
		!current.analysis ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-[var(--fg-muted)]",
			children: "Ce projet n'a pas encore d'analyse. Relancez un import depuis Nouveau projet."
		}) : null,
		revise ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RevisePanel, {
			title: tab === "analysis" ? "Corriger l'analyse" : "Modifier cette partie du plan",
			placeholder: tab === "analysis" ? "Ex. ce personnage est son frère, pas son mari. Je veux une maison africaine." : "Ex. raccourcir la scène 04 à 6 secondes, garder le même vêtement bleu.",
			busy,
			onClose: () => setRevise(null),
			onSubmit: (text) => void applyRevision(text)
		}) : null
	] });
}
function parseFocus(flag) {
	if (!flag || flag === "analysis") return { section: "all" };
	if (flag.startsWith("character:")) return {
		section: "character",
		characterId: flag.slice(10)
	};
	if (flag.startsWith("scene:")) return {
		section: "scene",
		sceneNumber: Number(flag.slice(6))
	};
	if (flag === "hook" || flag === "scenario" || flag === "style" || flag === "character" || flag === "scene" || flag === "all") return { section: flag };
	return { section: "all" };
}
//#endregion
export { ProjectPage as component };
