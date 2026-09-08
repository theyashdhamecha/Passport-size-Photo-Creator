"use client";
import { useRef } from "react";
import { useStore } from "@/lib/store";
import { requiredPx } from "@/lib/layout";

export default function PhotoLibrary() {
  const { images, settings, addImages, removeImage, setCount, distribute, armedImageId, setArmed, slots } =
    useStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const totalSlots = slots.length;
  const assigned = images.reduce((a, i) => a + i.count, 0);
  const remaining = totalSlots - assigned;

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const readers = Array.from(files).map(
      (file) =>
        new Promise<{ src: string; naturalW: number; naturalH: number }>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const src = e.target?.result as string;
            const img = new Image();
            img.onload = () => resolve({ src, naturalW: img.naturalWidth, naturalH: img.naturalHeight });
            img.src = src;
          };
          reader.readAsDataURL(file);
        })
    );
    Promise.all(readers).then(addImages);
  }

  function isLowRes(im: { naturalW: number; naturalH: number }) {
    return im.naturalW < requiredPx(settings.photoW, settings.dpi) || im.naturalH < requiredPx(settings.photoH, settings.dpi);
  }

  return (
    <div>
      <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">Photo library</h2>

      <label
        className="registration-tick block cursor-pointer rounded-lg border border-dashed border-line bg-paper-2/60 px-4 py-4 text-center transition hover:border-coral"
      >
        <span className="text-sm font-medium">+ Upload photos</span>
        <div className="mt-1 text-[11px] text-ink-soft">one photo, or several for a mixed sheet</div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      {images.length === 0 && (
        <p className="mt-3 text-[12px] leading-relaxed text-ink-soft">
          Nothing uploaded yet. Add photos above, set how many times each should appear, then hit Distribute.
        </p>
      )}

      <div className="mt-3 space-y-2">
        {images.map((im) => (
          <div
            key={im.id}
            onClick={() => setArmed(armedImageId === im.id ? null : im.id)}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-2.5 py-2 transition ${
              armedImageId === im.id ? "border-coral bg-coral/5" : "border-line bg-white/40"
            }`}
          >
            <div
              className="h-11 w-11 flex-none rounded-md bg-cover bg-center"
              style={{ backgroundImage: `url(${im.src})` }}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-medium">
                {isLowRes(im) && <span className="mr-1 rounded bg-warn/20 px-1 text-[9px] font-mono text-warn">LOW-RES</span>}
                {im.naturalW}×{im.naturalH}px
              </div>
            </div>
            <div className="flex flex-none items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                className="h-6 w-6 rounded bg-paper-2 text-sm leading-none text-ink hover:bg-paper-3 disabled:opacity-30"
                disabled={im.count <= 0}
                onClick={() => setCount(im.id, im.count - 1)}
              >
                −
              </button>
              <span className="w-6 text-center font-mono text-[12.5px]">{im.count}</span>
              <button
                className="h-6 w-6 rounded bg-paper-2 text-sm leading-none text-ink hover:bg-paper-3 disabled:opacity-30"
                disabled={remaining <= 0}
                onClick={() => setCount(im.id, im.count + 1)}
              >
                +
              </button>
              <button
                className="ml-1 h-6 w-6 rounded text-ink-soft hover:bg-danger/10 hover:text-danger"
                title="Remove from library"
                onClick={() => removeImage(im.id)}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {images.length > 0 && (
        <>
          <div className={`mt-3 flex items-center justify-between rounded-md px-3 py-2 font-mono text-[12px] ${
            remaining < 0 ? "bg-danger/10 text-danger" : "bg-paper-2 text-ink-soft"
          }`}>
            <span>{assigned} / {totalSlots} assigned</span>
            {remaining === 0 && <span>sheet full</span>}
          </div>
          <button
            className="mt-2 w-full rounded-lg bg-coral py-2.5 text-[13px] font-medium text-white transition hover:bg-coral-dark disabled:opacity-40"
            disabled={assigned === 0}
            onClick={distribute}
          >
            Distribute to sheet
          </button>
        </>
      )}
    </div>
  );
}
