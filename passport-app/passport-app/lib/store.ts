"use client";
import { create } from "zustand";
import { computeGrid, SheetSettings } from "./layout";

export interface LibraryImage {
  id: string;
  src: string; // data URL
  naturalW: number;
  naturalH: number;
  count: number; // how many cells this photo should fill
}

export interface Slot {
  imageId: string | null;
  zoom: number; // 100 = fit
  fracX: number;
  fracY: number;
}

interface Store {
  settings: SheetSettings;
  images: LibraryImage[];
  slots: Slot[];
  selectedSlot: number | null;
  armedImageId: string | null;

  setSettings: (s: Partial<SheetSettings>) => void;
  addImages: (imgs: { src: string; naturalW: number; naturalH: number }[]) => void;
  removeImage: (id: string) => void;
  setCount: (id: string, count: number) => void;
  distribute: () => void;
  assignToSlot: (idx: number, imageId: string) => void;
  clearSlot: (idx: number) => void;
  clearAll: () => void;
  resetCrops: () => void;
  selectSlot: (idx: number | null) => void;
  setSlotZoom: (idx: number, zoom: number) => void;
  panSlot: (idx: number, dFracX: number, dFracY: number) => void;
  duplicateSelectedToEmpty: () => void;
  setArmed: (id: string | null) => void;
  rebuildGrid: () => void;
  restoreState: (data: { settings: SheetSettings; images: LibraryImage[]; slots: Slot[] }) => void;
}

const defaultSettings: SheetSettings = {
  photoW: 35,
  photoH: 45,
  marginMM: 5,
  gapMM: 2,
  guides: true,
  dpi: 300,
};

function freshSlots(total: number, old: Slot[]): Slot[] {
  const out: Slot[] = [];
  for (let i = 0; i < total; i++) {
    out.push(old[i] ?? { imageId: null, zoom: 100, fracX: 0, fracY: 0 });
  }
  return out;
}

export const useStore = create<Store>((set, get) => ({
  settings: defaultSettings,
  images: [],
  slots: freshSlots(computeGrid(defaultSettings).total, []),
  selectedSlot: null,
  armedImageId: null,

  setSettings: (s) => {
    set((st) => ({ settings: { ...st.settings, ...s } }));
    get().rebuildGrid();
  },

  rebuildGrid: () => {
    const { total } = computeGrid(get().settings);
    set((st) => ({ slots: freshSlots(total, st.slots), selectedSlot: null }));
  },

  addImages: (imgs) => {
    const newOnes: LibraryImage[] = imgs.map((im, i) => ({
      id: `img_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 7)}`,
      src: im.src,
      naturalW: im.naturalW,
      naturalH: im.naturalH,
      count: 0,
    }));
    set((st) => ({
      images: [...st.images, ...newOnes],
      armedImageId: newOnes[0]?.id ?? st.armedImageId,
    }));
  },

  removeImage: (id) => {
    set((st) => ({
      images: st.images.filter((i) => i.id !== id),
      slots: st.slots.map((s) => (s.imageId === id ? { imageId: null, zoom: 100, fracX: 0, fracY: 0 } : s)),
      armedImageId: st.armedImageId === id ? null : st.armedImageId,
    }));
  },

  setCount: (id, count) => {
    const total = get().slots.length;
    const others = get().images.filter((i) => i.id !== id).reduce((a, i) => a + i.count, 0);
    const maxAllowed = Math.max(0, total - others);
    const c = Math.max(0, Math.min(count, maxAllowed));
    set((st) => ({ images: st.images.map((i) => (i.id === id ? { ...i, count: c } : i)) }));
  },

  distribute: () => {
    const { images, slots } = get();
    const seq: string[] = [];
    images.forEach((im) => {
      for (let i = 0; i < im.count; i++) seq.push(im.id);
    });
    const newSlots: Slot[] = slots.map((_, idx) =>
      seq[idx] ? { imageId: seq[idx], zoom: 100, fracX: 0, fracY: 0 } : { imageId: null, zoom: 100, fracX: 0, fracY: 0 }
    );
    set({ slots: newSlots });
  },

  assignToSlot: (idx, imageId) => {
    set((st) => {
      const slots = [...st.slots];
      slots[idx] = { imageId, zoom: 100, fracX: 0, fracY: 0 };
      return { slots };
    });
  },

  clearSlot: (idx) => {
    set((st) => {
      const slots = [...st.slots];
      slots[idx] = { imageId: null, zoom: 100, fracX: 0, fracY: 0 };
      return { slots };
    });
  },

  clearAll: () => {
    set((st) => ({ slots: st.slots.map(() => ({ imageId: null, zoom: 100, fracX: 0, fracY: 0 })), selectedSlot: null }));
  },

  resetCrops: () => {
    set((st) => ({ slots: st.slots.map((s) => ({ ...s, zoom: 100, fracX: 0, fracY: 0 })) }));
  },

  selectSlot: (idx) => set({ selectedSlot: idx }),

  setSlotZoom: (idx, zoom) => {
    set((st) => {
      const slots = [...st.slots];
      slots[idx] = { ...slots[idx], zoom };
      return { slots };
    });
  },

  panSlot: (idx, dFracX, dFracY) => {
    set((st) => {
      const slots = [...st.slots];
      const s = slots[idx];
      slots[idx] = {
        ...s,
        fracX: Math.max(-1, Math.min(1, s.fracX + dFracX)),
        fracY: Math.max(-1, Math.min(1, s.fracY + dFracY)),
      };
      return { slots };
    });
  },

  duplicateSelectedToEmpty: () => {
    const { selectedSlot, slots } = get();
    if (selectedSlot === null) return;
    const src = slots[selectedSlot];
    if (!src.imageId) return;
    set({
      slots: slots.map((s) => (s.imageId ? s : { ...src })),
    });
  },

  setArmed: (id) => set({ armedImageId: id }),

  restoreState: (data) => set({ settings: data.settings, images: data.images, slots: data.slots }),
}));
