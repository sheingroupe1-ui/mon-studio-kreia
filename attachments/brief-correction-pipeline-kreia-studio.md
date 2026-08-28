# BRIEF DE CORRECTION — Pipeline d'analyse KREIA Studio

## 🔒 CONSIGNE DE DÉPART

Un audit complet a déjà été fait. La cause racine est **identifiée et confirmée avec précision** (fichiers, lignes, mécanisme exact). Ne recommence pas un audit ni un diagnostic. N'ajoute pas un nouveau patch symptomatique sur l'étape 3 (identification des personnages) : ce n'est pas un bug d'identification de personnages, c'est un problème d'architecture de déploiement décrit ci-dessous.

Applique directement le plan de correction en section 3. Si un point n'est pas clair, demande avant de coder — ne devine pas.

---

## 1. DIAGNOSTIC CONFIRMÉ (cause racine)

L'app est déployée sur **Vercel** (`vite.config.ts`, preset `"vercel"`), **sans `maxDuration` configuré nulle part**. Les fonctions serverless Vercel ont donc une limite d'exécution par défaut courte (10 s sur Hobby, 15–60 s sur Pro sans config explicite).

Le pipeline d'analyse vidéo (étapes 3 à 7 : identification des personnages, style, scènes, narration, préparation) est conçu comme un système de "jobs" avec polling (`create` → `frame` → `audio` → `start` → `poll`), pensé pour des analyses longues étalées sur plusieurs requêtes HTTP. Un commentaire du code (`src/lib/kreia/job-store.ts`) confirme qu'une analyse complète peut prendre **jusqu'à ~12 minutes**.

Mais ce système de jobs repose sur un état stocké :
- en mémoire (`Map` globale, `src/lib/kreia/jobs.ts`)
- et sur `/tmp` (`src/lib/kreia/job-store.ts`)

**Ni l'un ni l'autre ne survit de façon fiable entre deux invocations d'une fonction serverless Vercel.** Pour contourner ça, `src/lib/kreia/jobs-http.ts` (lignes ~90 et ~113) contient un cas spécial :

```ts
if (process.env.VERCEL) {
  return json(await started.done); // attend la fin COMPLÈTE du job dans une seule requête HTTP
}
```

Cette requête unique attend donc la fin de tout le pipeline (potentiellement plusieurs minutes, avec plusieurs appels IA séquentiels — voir `pipeline.ts`, notamment la boucle par segment dans `runLongForm`). **Elle dépasse presque toujours la limite d'exécution de la fonction serverless.** Vercel tue alors la fonction et renvoie une page d'erreur HTML, que `src/lib/kreia/job-protocol.ts` (`looksLikeHtml()` / `messageFromHttpBody()`) transforme en message générique :

> "L'analyse n'a pas pu aboutir. Réessayez."

C'est ce message que l'utilisateur voit, systématiquement autour de l'étape 3, car c'est là que le budget de temps cumulé (validation + structure + identification personnages, qui contient déjà jusqu'à 2 appels IA de 120 s chacun) commence à dépasser la limite serverless.

### Point secondaire confirmé (étape 2)

L'étape "Analyse de la structure" n'appelle **jamais** l'IA. `src/lib/kreia/analysis-run.ts` appelle uniquement `fallbackStructure()` (calcul local, aucun appel réseau). Une vraie fonction `analyzeStructure()` existe dans `src/lib/kreia/engines/structure.ts` (avec appel `chat()`, logs, retry — exactement ce qu'attend le cahier des charges) **mais elle n'est appelée nulle part dans le code**. C'est du code mort d'une itération précédente. C'est pourquoi l'étape 2 passe instantanément : elle ne fait pas ce qu'elle est censée faire.

### Infrastructure déjà disponible (à réutiliser, pas à recréer)

L'app a déjà une vraie base Postgres externe branchée : **Neon** (`src/lib/db.ts`, backend actif dès que `DATABASE_URL` est défini, fallback PGLite sinon). **Ne pas ajouter Redis/KV/nouvelle brique** — réutiliser Neon pour la persistance du job.

---

## 2. CE QU'IL NE FAUT PAS FAIRE

- Ne pas ré-augmenter uniquement le nombre de tentatives ou le timeout du `chat()` sur l'étape 3 — le problème n'est pas là.
- Ne pas ajouter un nouveau système de progression ou un nouveau verrou/session en plus de l'existant (`activeSession` dans `analysis-run.ts` est déjà correct et unique — ne pas dupliquer).
- Ne pas se contenter d'augmenter `maxDuration` sans corriger l'architecture (voir section 3, étape 1 = pansement temporaire seulement).
- Ne pas introduire une nouvelle base/queue externe (Upstash, Redis, etc.) : Neon est déjà en place.

---

## 3. PLAN DE CORRECTION — 3 volets, dans cet ordre

### Volet A — Pansement immédiat (à faire en premier, sans risque)

Configurer `maxDuration` au maximum disponible sur le plan Vercel actuel, sur la route qui gère `/kreia/jobs` (via `vercel.json` ou l'export de config de route Nitro/TanStack Start correspondant). Ça ne résout pas le fond du problème mais réduit immédiatement la fréquence des échecs pendant qu'on implémente le volet B.

### Volet B — Correctif de fond (le vrai fix)

Objectif : chaque étape du pipeline devient sa **propre invocation serverless courte** (quelques secondes chacune), avec l'état du job persisté dans **Neon** au lieu de la `Map` en mémoire + `/tmp`.

Changements attendus :

1. **`src/lib/kreia/job-store.ts`** : remplacer la persistance fichier (`/tmp`) par des requêtes Neon (table `kreia_jobs` ou équivalent : id, type, status, result, error, progress, checkpoint, frames, audio_chunks, created_at, updated_at). Garder la même interface (`persistJob`, `readJob`, `forgetJob`, `pruneJobFiles`) pour limiter l'impact sur le reste du code.
2. **`src/lib/kreia/pipeline.ts`** : découper `runAnalysisPipeline` / `runCompact` / `runLongForm` pour qu'**une seule étape** (ou un seul segment, pour la boucle de `runLongForm`) s'exécute par invocation, puis retourne immédiatement avec le checkpoint mis à jour — au lieu d'enchaîner tous les appels `chat()` dans la même requête.
3. **`src/lib/kreia/jobs-http.ts`** : supprimer le court-circuit `if (process.env.VERCEL) { await started.done }`. Le `op === "start"` doit démarrer uniquement la première sous-étape et retourner tout de suite ; chaque `op === "poll"` suivant, si le job est toujours "running" et que la sous-étape en cours est terminée, déclenche la sous-étape suivante (ou la lit si déjà lancée) avant de répondre — toujours dans un temps court.
4. **`src/lib/kreia/job-client.ts`** : le polling existant côté client (`waitForDone`, `JOB_POLL_MS = 1200`, `JOB_WAIT_MS = 360_000`) devrait fonctionner tel quel une fois le state réellement partagé via Neon — vérifier seulement que `JOB_WAIT_MS` (6 min) est suffisant vu qu'un run complet peut aller jusqu'à ~12 min ; l'augmenter si besoin.

### Volet C — Nettoyage étape 2

Décider et appliquer un des deux choix :
- **Option retenue recommandée** : brancher réellement `analyzeStructure()` (déjà écrite dans `engines/structure.ts`) à la place de l'appel direct à `fallbackStructure()` dans `analysis-run.ts` / `pipeline.ts`, avec `fallbackStructure()` gardée uniquement comme repli en cas d'échec de `analyzeStructure()` (elle le fait déjà bien).
- Sinon : supprimer `analyzeStructure()` si l'équipe décide que l'heuristique locale suffit pour cette étape, pour ne pas laisser de code mort trompeur.

---

## 4. CRITÈRE DE RÉUSSITE

La correction n'est validée que lorsqu'une vraie vidéo (au moins un cas > 22 s ou > 6 frames pour déclencher `runLongForm`, le chemin le plus lourd) traverse réellement les 7 étapes de bout en bout **sans dépendre d'un run synchrone unique dans une seule requête HTTP**, et qu'un projet exploitable est produit. Tester aussi le cas où l'utilisateur ferme l'onglet en cours d'analyse et revient plus tard : le job doit pouvoir être repris via le `checkpoint` persisté en Neon.
