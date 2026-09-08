"use client";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { saveProject, loadProject } from "@/lib/db";
import PhotoLibrary from "./PhotoLibrary";
import SettingsPanel from "./SettingsPanel";
import SheetCanvas from "./SheetCanvas";
import SlotToolbar from "./SlotToolbar";
import ExportBar from "./ExportBar";
import AdSlot from "./AdSlot";

function SidebarContent() {
  return (
    <>
      <div className="registration-tick mb-1 flex items-center gap-2 text-ink">
        <div className="h-3 w-3 rotate-45 bg-coral" />
        <h1 className="font-display text-[17px] font-semibold">Proof Sheet</h1>
      </div>
      <p className="mb-6 font-mono text-[10.5px] text-ink-soft">print-ready A4 photo sheets · nothing leaves your device</p>
      <PhotoLibrary />
      <SettingsPanel />
    </>
  );
}

export default function Tool() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const store = useStore();
  const loaded = useRef(false);

  useEffect(() => {
    loadProject().then((data) => {
      if (data) useStore.getState().restoreState(data);
      loaded.current = true;
    });
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    const t = setTimeout(() => {
      saveProject({ settings: store.settings, images: store.images, slots: store.slots });
    }, 600);
    return () => clearTimeout(t);
  }, [store.settings, store.images, store.slots]);

  return (
    <div className="lg:flex">
      <aside className="hidden border-r border-line bg-paper-2/50 lg:sticky lg:top-0 lg:block lg:h-screen lg:w-[340px] lg:overflow-y-auto lg:p-6">
        <SidebarContent />
      </aside>

      <main className="flex-1 px-4 py-5 sm:px-8 sm:py-8">
        <div className="mb-5 flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rotate-45 bg-coral" />
            <span className="font-display text-[16px] font-semibold">Proof Sheet</span>
          </div>
          <button onClick={() => setDrawerOpen(true)} className="rounded-md border border-line px-3 py-1.5 text-[12.5px]">
            Controls
          </button>
        </div>

        <AdSlot variant="leaderboard" />

        <div className="mt-6">
          <SheetCanvas />
          <SlotToolbar />
          <ExportBar />
        </div>

        <div className="mt-8">
          <AdSlot variant="rectangle" />
        </div>
      </main>

      <div
        className={`no-print fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-line bg-paper-2 p-6 transition-transform lg:hidden ${
          drawerOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <button onClick={() => setDrawerOpen(false)} className="mb-4 text-[12.5px] text-ink-soft">
          Close ✕
        </button>
        <SidebarContent />
      </div>
      {drawerOpen && <div className="fixed inset-0 z-40 bg-ink/20 lg:hidden" onClick={() => setDrawerOpen(false)} />}
    </div>
  );
}
