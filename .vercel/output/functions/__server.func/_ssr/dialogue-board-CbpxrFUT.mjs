import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { A as mergeCharacterPair, E as labelCharacterType, F as reindexCharacters, L as swatchForCharacter, P as reassignDialogueSpeaker, a as applyDialogueEdits, g as emptyPerformance, k as matchCharacter, l as blankCharacter, m as duplicateWarnings, p as dialogueCharCount } from "./cast-edit-B0U-aGNG.mjs";
import { C as ChevronDown, S as ChevronUp, a as Trash2, c as Pencil, h as GitMerge, o as RefreshCw, s as Plus } from "../_libs/lucide-react.mjs";
import { i as cn, n as Button } from "./store-jieHu2MF.mjs";
import { n as Input, r as Textarea } from "./job-client-CQEEGWOt.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dialogue-board-CbpxrFUT.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Badge({ className, tone = "neutral", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide uppercase", tone === "neutral" && "bg-[color-mix(in_oklab,var(--fg)_8%,transparent)] text-[var(--fg-muted)]", tone === "gold" && "bg-[color-mix(in_oklab,var(--accent-fill)_70%,transparent)] text-[var(--accent)]", tone === "ok" && "bg-[color-mix(in_oklab,var(--color-ok)_18%,transparent)] text-[var(--color-ok)]", tone === "warn" && "bg-[color-mix(in_oklab,var(--color-danger)_16%,transparent)] text-[#e7b1a7]", tone === "muted" && "text-[var(--fg-subtle)] bg-transparent shadow-[inset_0_0_0_1px_var(--border)]", className),
		...props
	});
}
var LABELS = {
	observed: "Observé",
	inferred: "Déduit",
	proposed: "Proposé"
};
function ConfidenceBadge({ value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		tone: value === "observed" ? "ok" : value === "proposed" ? "gold" : "muted",
		children: LABELS[value]
	});
}
function SectionCard({ id, kicker, title, action, children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id,
		className: cn("rounded-[28px] bg-[var(--bg-elevated)] p-2 shadow-[var(--shadow-border)]", className),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-[20px] bg-[var(--bg-subtle)] px-5 py-5 sm:px-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 flex flex-wrap items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [kicker ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--champagne)]",
					children: kicker
				}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl font-medium tracking-[-0.02em] text-[var(--fg)]",
					children: title
				})] }), action]
			}), children]
		})
	});
}
function Field({ label, value, empty = "Non identifié" }) {
	const text = (value ?? "").trim();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: text ? "text-sm leading-relaxed text-[var(--fg)]" : "text-sm italic text-[var(--fg-subtle)]",
			children: text || empty
		})]
	});
}
function PromptBlock({ text }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
		className: "max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-[var(--radius-md)] bg-[var(--bg)] p-4 font-mono text-[13px] leading-relaxed text-[var(--fg)]",
		children: text || "—"
	});
}
var TYPES = [
	{
		id: "human",
		label: "Humain"
	},
	{
		id: "fruit_humanoid",
		label: "Fruit humanoïde"
	},
	{
		id: "angel",
		label: "Ange"
	},
	{
		id: "animated_character",
		label: "Animé"
	},
	{
		id: "animal_humanoid",
		label: "Animal humanoïde"
	},
	{
		id: "fantasy_character",
		label: "Fantastique"
	},
	{
		id: "unknown_character",
		label: "Inconnu"
	}
];
var PROMINENCE = {
	principal: "Principal",
	secondary: "Secondaire",
	punctual: "Ponctuel"
};
function CharacterCast({ characters, kind, warnings, onChange, onRerun, onValidate, validating }) {
	const [editingId, setEditingId] = (0, import_react.useState)(null);
	const [mergeFrom, setMergeFrom] = (0, import_react.useState)(null);
	const extraWarnings = duplicateWarnings(characters);
	const allWarnings = [...warnings ?? [], ...extraWarnings];
	function commit(next) {
		onChange(reindexCharacters(next, kind));
	}
	function update(id, patch) {
		commit(characters.map((c) => c.id === id ? {
			...c,
			...patch,
			userLocked: true
		} : c));
	}
	function remove(id) {
		commit(characters.filter((c) => c.id !== id));
		if (editingId === id) setEditingId(null);
		if (mergeFrom === id) setMergeFrom(null);
	}
	function add() {
		const next = blankCharacter(kind, characters.length);
		commit([...characters, next]);
		setEditingId(next.id);
	}
	function mergeInto(targetId) {
		if (!mergeFrom || mergeFrom === targetId) {
			setMergeFrom(null);
			return;
		}
		const keep = characters.find((c) => c.id === targetId);
		const drop = characters.find((c) => c.id === mergeFrom);
		if (!keep || !drop) return;
		const merged = mergeCharacterPair(keep, drop);
		commit(characters.filter((c) => c.id !== drop.id).map((c) => c.id === keep.id ? merged : c));
		setMergeFrom(null);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-end justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]",
					children: "Personnages identifiés"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					className: "font-display text-2xl text-[var(--fg)]",
					children: [
						characters.length,
						" ",
						characters.length > 1 ? "personnages détectés" : "personnage détecté"
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						type: "button",
						variant: "outline",
						size: "sm",
						onClick: add,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3.5" }), "Ajouter"]
					}), onRerun ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						type: "button",
						variant: "outline",
						size: "sm",
						onClick: onRerun,
						disabled: validating,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "size-3.5" }), "Relancer l'identification"]
					}) : null]
				})]
			}),
			allWarnings.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-[var(--radius-md)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--fg-muted)]",
				children: allWarnings.map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["— ", w] }, w))
			}) : null,
			characters.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-[var(--fg-muted)]",
				children: "Aucun personnage n'a été identifié. Ajoutez-en un manuellement ou relancez l'identification."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "grid gap-3",
				children: characters.map((c, i) => {
					const editing = editingId === c.id;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "rounded-[var(--radius-lg)] bg-[var(--bg)] p-4 shadow-[inset_0_0_0_1px_var(--border)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-start justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mt-1 size-2.5 shrink-0 rounded-full",
										style: { background: `var(${swatchForCharacter(c, i).cssVar})` }
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "font-mono text-[11px] tracking-wide text-[var(--accent)]",
										children: [
											i + 1,
											" · ",
											c.id
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-display text-xl",
										children: c.name || c.designation
									})] })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: labelCharacterType(c.characterType) }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: PROMINENCE[c.prominence] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfidenceBadge, { value: c.nameConfidence })
									]
								})]
							}),
							editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 grid gap-3 sm:grid-cols-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "text-xs text-[var(--fg-subtle)]",
										children: ["Nom", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											className: "mt-1",
											value: c.name ?? "",
											onChange: (e) => update(c.id, {
												name: e.target.value || null,
												designation: e.target.value || c.designation
											})
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "text-xs text-[var(--fg-subtle)]",
										children: ["Type", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
											className: "mt-1 h-10 w-full rounded-[var(--radius-md)] bg-[var(--bg-elevated)] px-3 text-sm text-[var(--fg)]",
											value: c.characterType ?? "unknown_character",
											onChange: (e) => update(c.id, { characterType: e.target.value }),
											children: TYPES.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: t.id,
												children: t.label
											}, t.id))
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "text-xs text-[var(--fg-subtle)] sm:col-span-2",
										children: ["Apparence", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
											className: "mt-1",
											value: c.appearance,
											onChange: (e) => update(c.id, { appearance: e.target.value })
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "text-xs text-[var(--fg-subtle)]",
										children: ["Cheveux", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											className: "mt-1",
											value: c.hair,
											onChange: (e) => update(c.id, { hair: e.target.value })
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "text-xs text-[var(--fg-subtle)]",
										children: ["Yeux", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											className: "mt-1",
											value: c.eyes,
											onChange: (e) => update(c.id, { eyes: e.target.value })
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "text-xs text-[var(--fg-subtle)]",
										children: ["Teint", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											className: "mt-1",
											value: c.complexion,
											onChange: (e) => update(c.id, { complexion: e.target.value })
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "text-xs text-[var(--fg-subtle)]",
										children: ["Morphologie", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											className: "mt-1",
											value: c.morphology,
											onChange: (e) => update(c.id, { morphology: e.target.value })
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "text-xs text-[var(--fg-subtle)]",
										children: ["Vêtements", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											className: "mt-1",
											value: c.clothing,
											onChange: (e) => update(c.id, { clothing: e.target.value })
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "text-xs text-[var(--fg-subtle)]",
										children: ["Rôle", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											className: "mt-1",
											value: c.role,
											onChange: (e) => update(c.id, { role: e.target.value })
										})]
									})
								]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 grid gap-3 sm:grid-cols-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Apparence",
										value: c.appearance
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Vêtements",
										value: c.clothing
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Âge apparent",
										value: c.ageApparent
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Rôle",
										value: c.role
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 flex flex-wrap gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										type: "button",
										variant: "ghost",
										size: "sm",
										onClick: () => setEditingId(editing ? null : c.id),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "size-3.5" }), editing ? "Fermer" : "Modifier"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										type: "button",
										variant: "ghost",
										size: "sm",
										onClick: () => mergeFrom ? mergeInto(c.id) : setMergeFrom(c.id),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GitMerge, { className: "size-3.5" }), mergeFrom === c.id ? "Choisir la cible…" : mergeFrom ? "Fusionner ici" : "Fusionner"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										type: "button",
										variant: "ghost",
										size: "sm",
										onClick: () => remove(c.id),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" }), "Supprimer"]
									})
								]
							})
						]
					}, c.id);
				})
			}),
			onValidate ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				disabled: validating,
				onClick: onValidate,
				children: "Valider les personnages"
			}) : null
		]
	});
}
function SpeakerPip({ colorVar }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "inline-block size-2.5 shrink-0 rounded-full",
		style: { background: `var(${colorVar})` },
		"aria-hidden": true
	});
}
function SpeakerSelect({ line, characters, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "relative inline-flex min-h-11 min-w-40 items-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "sr-only",
				children: "Personnage qui parle"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
				className: "h-11 w-full appearance-none rounded-[var(--radius-md)] bg-[var(--bg-elevated)] pl-3 pr-8 text-sm text-[var(--fg)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--fg)_14%,transparent)] focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_1px_var(--accent),0_0_0_3px_color-mix(in_oklab,var(--accent)_25%,transparent)]",
				value: line.speakerId ?? "",
				onChange: (e) => onChange(e.target.value || null),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
					value: "",
					children: "Attribution à vérifier"
				}), characters.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
					value: c.id,
					children: [
						c.name || c.designation,
						" (",
						c.id,
						")"
					]
				}, c.id))]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "pointer-events-none absolute right-2 size-4 text-[var(--fg-subtle)]" })
		]
	});
}
function PerformanceFields({ line, editable, onChange }) {
	const p = line.performance ?? emptyPerformance();
	function patch(key, value) {
		onChange({
			...p,
			[key]: value
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-3 grid gap-2 sm:grid-cols-2",
		children: [[
			{
				key: "emotionDominant",
				label: "Émotion"
			},
			{
				key: "tone",
				label: "Ton"
			},
			{
				key: "facialExpression",
				label: "Expression"
			},
			{
				key: "gaze",
				label: "Regard"
			},
			{
				key: "gesture",
				label: "Geste"
			},
			{
				key: "posture",
				label: "Posture"
			},
			{
				key: "tears",
				label: "Larmes"
			},
			{
				key: "evolution",
				label: "Évolution",
				wide: true
			}
		].map((field) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
			className: field.wide ? "grid gap-1 sm:col-span-2" : "grid gap-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]",
				children: field.label
			}), editable ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				className: "h-11",
				value: String(p[field.key] ?? ""),
				onChange: (e) => patch(field.key, e.target.value)
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm text-[var(--fg)]",
				children: String(p[field.key] || "—")
			})]
		}, field.key)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
			className: "grid gap-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]",
				children: "Intensité"
			}), editable ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				type: "number",
				min: 0,
				max: 10,
				className: "h-11",
				value: p.intensity || "",
				onChange: (e) => patch("intensity", Math.min(10, Math.max(0, Number(e.target.value) || 0)))
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm text-[var(--fg)]",
				children: p.intensity ? `${p.intensity}/10` : "—"
			})]
		})]
	});
}
function DialogueBoard({ analysis, onChange, onValidate, validating }) {
	const lines = (analysis.dialogues?.lines ?? []).slice().sort((a, b) => a.order - b.order);
	const characters = analysis.characters;
	const editable = Boolean(onChange);
	function commit(nextLines) {
		onChange?.(applyDialogueEdits(analysis, nextLines));
	}
	function move(index, dir) {
		const ordered = lines.slice();
		const target = index + dir;
		if (target < 0 || target >= ordered.length) return;
		const a = ordered[index];
		const b = ordered[target];
		ordered[index] = {
			...b,
			order: a.order
		};
		ordered[target] = {
			...a,
			order: b.order
		};
		commit(ordered);
	}
	if (!lines.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-[var(--fg-muted)]",
			children: "Aucun dialogue identifiable. Rien n’a été inventé."
		}), onValidate ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			type: "button",
			disabled: validating,
			onClick: onValidate,
			children: "Valider les dialogues"
		}) : null]
	});
	const unverified = lines.filter((l) => l.attribution === "unverified" || !l.speakerId).length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-[var(--fg-subtle)]",
				children: [
					"Référence source :",
					" ",
					analysis.dialogues.source === "transcript" ? "transcription" : analysis.dialogues.source === "subtitles" ? "sous-titres" : analysis.dialogues.source === "visual-inference" ? "contexte visuel" : "non disponible",
					". Une réplique = un personnage, dans l’ordre source, avec l’interprétation observée."
				]
			}),
			unverified ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "rounded-[var(--radius-md)] bg-[color-mix(in_oklab,var(--speaker-amber)_16%,transparent)] px-3 py-2 text-xs text-[var(--fg)]",
				children: [
					unverified,
					" réplique",
					unverified > 1 ? "s" : "",
					" à attribuer. Choisis le personnage avant de générer."
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-2",
				children: lines.map((line, index) => {
					const character = matchCharacter(line.speakerId, characters);
					const swatch = swatchForCharacter(character, Math.max(0, characters.findIndex((c) => c.id === line.speakerId)));
					const sceneLines = lines.filter((l) => l.sceneNumber === line.sceneNumber);
					const chars = dialogueCharCount(sceneLines);
					const firstOfScene = sceneLines[0]?.id === line.id;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [firstOfScene ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mb-2 mt-4 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]",
						children: [
							"Scène ",
							String(line.sceneNumber).padStart(2, "0"),
							" · TOTAL DIALOGUES : ",
							chars,
							" caractères"
						]
					}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: cn("rounded-[var(--radius-lg)] bg-[var(--bg)] p-3 sm:p-4", line.attribution === "unverified" && "shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--speaker-amber)_55%,transparent)]"),
						style: { boxShadow: `inset 3px 0 0 var(${swatch.cssVar})` },
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SpeakerPip, { colorVar: swatch.cssVar }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: "muted",
										children: line.id
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
										tone: "muted",
										children: ["Réplique ", line.order]
									}),
									line.attribution === "unverified" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: "gold",
										children: "Attribution à vérifier"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: "ok",
										children: "Attribué"
									}),
									editable ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "ml-auto flex gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "button",
											variant: "ghost",
											size: "sm",
											disabled: index === 0,
											onClick: () => move(index, -1),
											"aria-label": "Monter la réplique",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { className: "size-4" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "button",
											variant: "ghost",
											size: "sm",
											disabled: index === lines.length - 1,
											onClick: () => move(index, 1),
											"aria-label": "Descendre la réplique",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-4" })
										})]
									}) : null
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 flex flex-col gap-3 sm:flex-row sm:items-start",
								children: [editable ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SpeakerSelect, {
									line,
									characters,
									onChange: (speakerId) => {
										commit(lines.map((item) => item.id === line.id ? reassignDialogueSpeaker(item, speakerId, characters) : item));
									}
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "flex min-h-11 items-center gap-2 text-sm font-medium",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SpeakerPip, { colorVar: swatch.cssVar }), line.speakerLabel || "Locuteur à vérifier"]
								}), editable ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
									className: "min-h-20 flex-1",
									value: line.displayText || line.sourceText,
									onChange: (e) => {
										const value = e.target.value;
										commit(lines.map((item) => item.id === line.id ? {
											...item,
											displayText: value,
											sourceText: item.sourceText || value
										} : item));
									}
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "flex-1 text-sm italic leading-relaxed text-[var(--fg)]",
									children: line.displayText || line.sourceText || "…"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PerformanceFields, {
								line,
								editable,
								onChange: (performance) => {
									commit(lines.map((item) => item.id === line.id ? {
										...item,
										performance
									} : item));
								}
							})
						]
					})] }, line.id);
				})
			}),
			onValidate ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				disabled: validating,
				onClick: onValidate,
				children: "Valider les dialogues"
			}) : null
		]
	});
}
//#endregion
export { Field as a, DialogueBoard as i, CharacterCast as n, PromptBlock as o, ConfidenceBadge as r, SectionCard as s, Badge as t };
