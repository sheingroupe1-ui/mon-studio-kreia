import type { KreiaProject, ProjectKind } from "./types";
import { kindById } from "./kinds";
import { withFormattedPrompts } from "./engines/prompt-dossier";

function kindByIdSafe(kind: ProjectKind): string {
  try {
    return kindById(kind).label;
  } catch {
    return kind;
  }
}

function block(title: string, body: string) {
  return `## ${title}\n\n${body.trim()}\n`;
}

export function projectToMarkdown(project: KreiaProject): string {
  const a = project.analysis;
  const p = a && project.production ? withFormattedPrompts(project.production, a) : project.production;
  const lines: string[] = [
    `# ${project.title}`,
    "",
    `- Type : ${kindByIdSafe(project.kind)}`,
    `- Mode : ${project.mode}`,
    `- Durée source : ${project.video.durationSeconds.toFixed(1)} s`,
    "",
  ];

  if (a) {
    lines.push(
      block(
        "Analyse — résumé observé",
        `${a.observedSummary}\n\nLimitations : ${a.limitations.join(" ; ") || "aucune"}`,
      ),
      block("Hook original", a.hook.firstSecondsDescription),
      block(
        "Style visuel verrouillé",
        `${a.visualStyle.lockedStylePhrase}\n${a.visualStyle.artisticStyle}`,
      ),
    );
    for (const c of a.characters) {
      lines.push(
        block(
          `${c.id} — ${c.designation}`,
          [
            c.name ? `Nom : ${c.name}` : null,
            `Rôle : ${c.role}`,
            `Apparence : ${c.appearance}`,
            `Vêtements : ${c.clothing}`,
          ]
            .filter(Boolean)
            .join("\n"),
        ),
      );
    }
  }

  if (p) {
    lines.push(
      block("Hook reconstruit", p.hook.reconstructed),
      block("Prompt hook", p.hook.visualPrompt),
      block("Logline", p.scenario.logline),
      block("Synopsis", p.scenario.synopsis),
    );
    for (const c of p.characters) {
      lines.push(
        block(`Fiche ${c.id}`, c.formattedSheet || c.bible),
        block(`Prompt image ${c.id}`, c.formattedSheet || c.imagePrompt),
      );
    }
    lines.push(
      block("Style de production", `${p.visualStyle.lockedPhrase}\n${p.visualStyle.productionNotes}`),
    );
    for (const s of p.scenes) {
      lines.push(
        block(
          `Scène ${String(s.number).padStart(2, "0")} (${s.duration}s)`,
          [
            `Lieu : ${s.location}`,
            `Action : ${s.action}`,
            `Caméra : ${s.camera}`,
            `Audio : ${s.audio}`,
            s.dialogue ? `Dialogue source : ${s.dialogue}` : "Dialogue : aucun",
            "",
            "Prompt scène :",
            s.formattedPrompt || s.videoPrompt,
          ].join("\n"),
        ),
      );
    }
  }

  return lines.join("\n");
}

export function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
