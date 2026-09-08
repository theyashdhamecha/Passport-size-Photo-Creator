"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { computeGrid } from "@/lib/layout";
import { renderSheetCanvas, downloadPNG, downloadPDF, shareCanvas } from "@/lib/exportSheet";

export default function ExportBar() {
  const { settings, images, slots } = useStore();
  const [busy, setBusy] = useState<string | null>(null);
  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  async function run(kind: "png" | "pdf" | "share") {
    setBusy(kind);
    try {
      const { cols } = computeGrid(settings);
      const canvas = await renderSheetCanvas(settings, images, slots, cols);
      if (kind === "png") await downloadPNG(canvas, settings.dpi);
      if (kind === "pdf") downloadPDF(canvas);
      if (kind === "share") await shareCanvas(canvas);
    } finally {
      setBusy(null);
    }
  }

  const filled = slots.some((s) => s.imageId);

  return (
    <div className="no-print mt-4 flex flex-wrap gap-2.5">
      <button disabled={!filled || !!busy} onClick={() => run("png")}
        className="rounded-lg bg-coral px-5 py-2.5 text-[13px] font-medium text-white transition hover:bg-coral-dark disabled:opacity-40">
        {busy === "png" ? "Rendering…" : `Download PNG (${settings.dpi} DPI)`}
      </button>
      <button disabled={!filled || !!busy} onClick={() => run("pdf")}
        className="rounded-lg bg-teal px-5 py-2.5 text-[13px] font-medium text-white transition hover:bg-teal-dark disabled:opacity-40">
        {busy === "pdf" ? "Rendering…" : "Download PDF"}
      </button>
      {canShare && (
        <button disabled={!filled || !!busy} onClick={() => run("share")}
          className="rounded-lg border border-line px-5 py-2.5 text-[13px] font-medium hover:bg-paper-2 disabled:opacity-40">
          Share
        </button>
      )}
    </div>
  );
}
