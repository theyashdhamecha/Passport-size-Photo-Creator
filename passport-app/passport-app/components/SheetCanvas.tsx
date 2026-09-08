"use client";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { PAGE_W_MM, PAGE_H_MM, computeGrid, clamp, requiredPx } from "@/lib/layout";

const BASE_PX_PER_MM = 3.6; // native (unscaled) preview density

export default function SheetCanvas() {
  const { settings, slots, images, selectedSlot, armedImageId, assignToSlot, selectSlot, clearSlot, panSlot } =
    useStore();
  const grid = computeGrid(settings);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const pageWpx = PAGE_W_MM * BASE_PX_PER_MM;
  const pageHpx = PAGE_H_MM * BASE_PX_PER_MM;

  useEffect(() => {
    function fit() {
      if (!wrapRef.current) return;
      const avail = wrapRef.current.clientWidth - 8;
      setScale(Math.min(1, avail / pageWpx));
    }
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [pageWpx]);

  return (
    <div ref={wrapRef} className="w-full">
      <div
        className="mx-auto rounded-sm bg-ink/5 p-3 sm:p-6"
        style={{ width: pageWpx * scale + 24 }}
      >
        <div
          className="relative mx-auto grid bg-white shadow-[0_2px_16px_rgba(35,42,59,0.18)]"
          style={{
            width: pageWpx,
            height: pageHpx,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            padding: settings.marginMM * BASE_PX_PER_MM,
            gap: settings.gapMM * BASE_PX_PER_MM,
            gridTemplateColumns: `repeat(${grid.cols}, ${settings.photoW * BASE_PX_PER_MM}px)`,
            gridTemplateRows: `repeat(${grid.rows}, ${settings.photoH * BASE_PX_PER_MM}px)`,
          }}
        >
          {slots.map((slot, idx) => (
            <Slot
              key={idx}
              idx={idx}
              slot={slot}
              cellW={settings.photoW * BASE_PX_PER_MM}
              cellH={settings.photoH * BASE_PX_PER_MM}
              guides={settings.guides}
              selected={selectedSlot === idx}
              lowRes={
                !!slot.imageId &&
                (() => {
                  const im = images.find((i) => i.id === slot.imageId);
                  return !!im && (im.naturalW < requiredPx(settings.photoW, settings.dpi) || im.naturalH < requiredPx(settings.photoH, settings.dpi));
                })()
              }
              imageSrc={slot.imageId ? images.find((i) => i.id === slot.imageId)?.src ?? null : null}
              onClick={() => {
                if (armedImageId && !slot.imageId) assignToSlot(idx, armedImageId);
                else selectSlot(idx);
              }}
              onClear={() => clearSlot(idx)}
              onPan={(dx, dy) => panSlot(idx, dx, dy)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Slot({
  idx, slot, cellW, cellH, guides, selected, lowRes, imageSrc, onClick, onClear, onPan,
}: {
  idx: number; slot: { imageId: string | null; zoom: number; fracX: number; fracY: number };
  cellW: number; cellH: number; guides: boolean; selected: boolean; lowRes: boolean;
  imageSrc: string | null; onClick: () => void; onClear: () => void; onPan: (dx: number, dy: number) => void;
}) {
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const { images } = useStore();
  const im = imageSrc ? images.find((i) => i.src === imageSrc) : null;

  let bgSize = "cover", bgPos = "center";
  if (im) {
    const coverScale = Math.max(cellW / im.naturalW, cellH / im.naturalH);
    const sizeW = im.naturalW * coverScale * (slot.zoom / 100);
    const sizeH = im.naturalH * coverScale * (slot.zoom / 100);
    bgSize = `${sizeW}px ${sizeH}px`;
    const baseX = (cellW - sizeW) / 2;
    const baseY = (cellH - sizeH) / 2;
    const x = clamp(baseX + slot.fracX * cellW, Math.min(0, cellW - sizeW), 0);
    const y = clamp(baseY + slot.fracY * cellH, Math.min(0, cellH - sizeH), 0);
    bgPos = `${x}px ${y}px`;
  }

  return (
    <div
      className={`group relative cursor-grab overflow-hidden bg-[repeating-linear-gradient(45deg,#EEE8D9,#EEE8D9_4px,#F6F3EA_4px,#F6F3EA_8px)] ${
        guides ? "outline outline-1 outline-dashed outline-ink/20 -outline-offset-1" : ""
      } ${selected ? "outline outline-2 outline-coral -outline-offset-2 z-10" : ""}`}
      onClick={onClick}
      onPointerDown={(e) => {
        if (!slot.imageId) return;
        dragging.current = true;
        last.current = { x: e.clientX, y: e.clientY };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return;
        const dx = e.clientX - last.current.x;
        const dy = e.clientY - last.current.y;
        last.current = { x: e.clientX, y: e.clientY };
        onPan(dx / cellW, dy / cellH);
      }}
      onPointerUp={() => (dragging.current = false)}
    >
      {imageSrc && (
        <div
          className="absolute inset-0"
          style={{ backgroundImage: `url(${imageSrc})`, backgroundSize: bgSize, backgroundPosition: bgPos, backgroundRepeat: "no-repeat" }}
        />
      )}
      {!imageSrc && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-lg font-light text-ink-soft/50">+</div>
      )}
      {lowRes && (
        <div className="absolute left-0.5 top-0.5 rounded bg-warn px-1 text-[8px] font-mono font-bold text-white">LOW-RES</div>
      )}
      {slot.imageId && (
        <button
          className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded bg-ink/70 text-[10px] text-white opacity-0 transition group-hover:opacity-100"
          onClick={(e) => { e.stopPropagation(); onClear(); }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
