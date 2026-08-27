import type { KreiaProject } from "./types";

const DB_NAME = "kreia-lab";
const DB_VERSION = 1;
const STORE = "projects";
const LIST_KEY = "kreia.project-index";

type ProjectIndexItem = {
  id: string;
  title: string;
  updatedAt: string;
  status: KreiaProject["status"];
  kind: KreiaProject["kind"];
  thumbnailDataUrl?: string;
  durationSeconds: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function readIndex(): ProjectIndexItem[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(LIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ProjectIndexItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeIndex(items: ProjectIndexItem[]) {
  localStorage.setItem(LIST_KEY, JSON.stringify(items));
}

function toIndex(p: KreiaProject): ProjectIndexItem {
  return {
    id: p.id,
    title: p.title,
    updatedAt: p.updatedAt,
    status: p.status,
    kind: p.kind,
    thumbnailDataUrl: p.thumbnailDataUrl,
    durationSeconds: p.video.durationSeconds,
  };
}

export function listProjectIndex(): ProjectIndexItem[] {
  return readIndex().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function saveProject(project: KreiaProject): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).put(project);
  await txDone(tx);
  db.close();
  const items = readIndex().filter((i) => i.id !== project.id);
  items.unshift(toIndex(project));
  writeIndex(items);
}

export async function loadProject(id: string): Promise<KreiaProject | null> {
  const db = await openDb();
  const tx = db.transaction(STORE, "readonly");
  const req = tx.objectStore(STORE).get(id);
  const value = await new Promise<KreiaProject | undefined>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result as KreiaProject | undefined);
    req.onerror = () => reject(req.error);
  });
  await txDone(tx);
  db.close();
  return value ?? null;
}

export async function deleteProject(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).delete(id);
  await txDone(tx);
  db.close();
  writeIndex(readIndex().filter((i) => i.id !== id));
}

export type { ProjectIndexItem };
