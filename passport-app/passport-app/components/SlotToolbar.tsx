"use client";
import { useRef } from "react";
import { useStore } from "@/lib/store";

export default function SlotToolbar() {
  const { selectedSlot, slots, setSlotZoom, duplicateSelectedToEmpty, clearSlot, selectSlot, addImages, assignToSlot } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  if (selectedSlot === null) return null;
  const slot = slots[selectedSlot];

  function replace(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        addImages([{ src, naturalW: img.naturalWidth, naturalH: img.naturalHeight }]);
        const id = useStore.getState().images.at(-1)?.id;
        if (id && selectedSlot !== null) assignToSlot(selectedSlot, id);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="no-print mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-line bg-white/70 px-4 py-3">
      <span className="font-mono text-[11px] text-ink-soft">Cell {selectedSlot + 1}</span>
      <div className="flex flex-1 min-w-[160px] items-center gap-2">
        <span className="text-[12px] text-ink-soft">Zoom</span>
        <input
          type="range" min={100} max={300} value={slot.zoom}
          onChange={(e) => setSlotZoom(selectedSlot, parseFloat(e.target.value))}
          className="w-full accent-coral"
          disabled={!slot.imageId}
        />
      </div>
      <div className="flex gap-2">
        <button className="rounded-md border border-line px-3 py-1.5 text-[12px] hover:bg-paper-2" onClick={() => fileRef.current?.click()}>
          Replace
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { replace(e.target.files); e.target.value = ""; }} />
        <button className="rounded-md border border-line px-3 py-1.5 text-[12px] hover:bg-paper-2 disabled:opacity-40" disabled={!slot.imageId} onClick={duplicateSelectedToEmpty}>
          Copy to empty cells
        </button>
        <button className="rounded-md border border-line px-3 py-1.5 text-[12px] hover:bg-danger/10 hover:text-danger" onClick={() => { clearSlot(selectedSlot); selectSlot(null); }}>
          Clear
        </button>
      </div>
    </div>
  );
}
