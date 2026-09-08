"use client";
import { openDB } from "idb";
import type { SheetSettings } from "./layout";
import type { LibraryImage, Slot } from "./store";

const DB_NAME = "passport-sheet-db";
const STORE = "autosave";
const KEY = "current";

async function getDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    },
  });
}

export async function saveProject(data: { settings: SheetSettings; images: LibraryImage[]; slots: Slot[] }) {
  try {
    const db = await getDb();
    await db.put(STORE, data, KEY);
  } catch {
    // storage full or unavailable — fail silently, it's just autosave
  }
}

export async function loadProject(): Promise<
  { settings: SheetSettings; images: LibraryImage[]; slots: Slot[] } | undefined
> {
  try {
    const db = await getDb();
    return await db.get(STORE, KEY);
  } catch {
    return undefined;
  }
}

export async function clearProject() {
  try {
    const db = await getDb();
    await db.delete(STORE, KEY);
  } catch {
    /* noop */
  }
}
