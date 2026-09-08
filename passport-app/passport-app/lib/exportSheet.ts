"use client";
import jsPDF from "jspdf";
import { MM_PER_IN, PAGE_W_MM, PAGE_H_MM, SheetSettings, clamp } from "./layout";
import type { LibraryImage, Slot } from "./store";

const imgCache = new Map<string, HTMLImageElement>();

function loadImg(src: string): Promise<HTMLImageElement> {
  if (imgCache.has(src)) return Promise.resolve(imgCache.get(src)!);
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => {
      imgCache.set(src, im);
      resolve(im);
    };
    im.onerror = reject;
    im.src = src;
  });
}

export async function renderSheetCanvas(
  settings: SheetSettings,
  images: LibraryImage[],
  slots: Slot[],
  cols: number
): Promise<HTMLCanvasElement> {
  const pxPerMM = settings.dpi / MM_PER_IN;
  const pageWpx = Math.round(PAGE_W_MM * pxPerMM);
  const pageHpx = Math.round(PAGE_H_MM * pxPerMM);

  const canvas = document.createElement("canvas");
  canvas.width = pageWpx;
  canvas.height = pageHpx;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, pageWpx, pageHpx);

  const marginPx = settings.marginMM * pxPerMM;
  const gapPx = settings.gapMM * pxPerMM;
  const cellWpx = settings.photoW * pxPerMM;
  const cellHpx = settings.photoH * pxPerMM;

  await Promise.all(
    Array.from(new Set(slots.filter((s) => s.imageId).map((s) => s.imageId!))).map((id) => {
      const im = images.find((i) => i.id === id);
      return im ? loadImg(im.src) : Promise.resolve();
    })
  );

  slots.forEach((slot, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const cx = marginPx + col * (cellWpx + gapPx);
    const cy = marginPx + row * (cellHpx + gapPx);

    if (slot.imageId) {
      const imObj = images.find((i) => i.id === slot.imageId);
      const htmlImg = imObj ? imgCache.get(imObj.src) : undefined;
      if (imObj && htmlImg) {
        const iw = imObj.naturalW,
          ih = imObj.naturalH;
        const coverScale = Math.max(cellWpx / iw, cellHpx / ih);
        const zoomMult = slot.zoom / 100;
        const sizeW = iw * coverScale * zoomMult;
        const sizeH = ih * coverScale * zoomMult;
        const baseX = (cellWpx - sizeW) / 2;
        const baseY = (cellHpx - sizeH) / 2;
        const x = clamp(baseX + slot.fracX * cellWpx, Math.min(0, cellWpx - sizeW), 0);
        const y = clamp(baseY + slot.fracY * cellHpx, Math.min(0, cellHpx - sizeH), 0);
        ctx.save();
        ctx.beginPath();
        ctx.rect(cx, cy, cellWpx, cellHpx);
        ctx.clip();
        ctx.drawImage(htmlImg, cx + x, cy + y, sizeW, sizeH);
        ctx.restore();
      }
    }
    if (settings.guides) {
      ctx.save();
      ctx.strokeStyle = "rgba(35,42,59,0.35)";
      ctx.lineWidth = Math.max(1, pxPerMM * 0.12);
      ctx.setLineDash([pxPerMM * 1.2, pxPerMM * 1.2]);
      ctx.strokeRect(cx, cy, cellWpx, cellHpx);
      ctx.restore();
    }
  });

  return canvas;
}

export async function downloadPNG(canvas: HTMLCanvasElement, dpi: number) {
  return new Promise<void>((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `passport-sheet-${dpi}dpi.png`;
      a.click();
      URL.revokeObjectURL(url);
      resolve();
    }, "image/png");
  });
}

export function downloadPDF(canvas: HTMLCanvasElement) {
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const dataUrl = canvas.toDataURL("image/png", 1.0);
  pdf.addImage(dataUrl, "PNG", 0, 0, PAGE_W_MM, PAGE_H_MM, undefined, "FAST");
  pdf.save("passport-sheet.pdf");
}

export async function shareCanvas(canvas: HTMLCanvasElement) {
  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return false;
  const file = new File([blob], "passport-sheet.png", { type: "image/png" });
  const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean };
  if (nav.canShare && nav.canShare({ files: [file] }) && navigator.share) {
    await navigator.share({ files: [file], title: "Passport photo sheet" });
    return true;
  }
  return false;
}
