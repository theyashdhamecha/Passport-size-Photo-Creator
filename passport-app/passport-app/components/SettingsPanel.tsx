"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { PRESETS, computeGrid } from "@/lib/layout";

export default function SettingsPanel() {
  const { settings, setSettings } = useStore();
  const [preset, setPreset] = useState("35x45");
  const grid = computeGrid(settings);

  return (
    <div className="perforated pt-5">
      <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">Photo standard</h2>
      <select
        className="w-full rounded-md border border-line bg-white/70 px-2.5 py-2 text-[13px]"
        value={preset}
        onChange={(e) => {
          const v = e.target.value;
          setPreset(v);
          if (v !== "custom") {
            const [w, h] = PRESETS[v];
            setSettings({ photoW: w, photoH: h });
          }
        }}
      >
        {Object.entries(PRESETS).map(([k, v]) => (
          <option key={k} value={k}>{v[2]}</option>
        ))}
        <option value="custom">Custom size…</option>
      </select>

      {preset === "custom" && (
        <div className="mt-2 flex items-center gap-2 font-mono text-[12.5px]">
          <input
            type="number"
            className="w-16 rounded border border-line px-2 py-1"
            value={settings.photoW}
            onChange={(e) => setSettings({ photoW: parseFloat(e.target.value) || settings.photoW })}
          />
          <span className="text-ink-soft">× mm ×</span>
          <input
            type="number"
            className="w-16 rounded border border-line px-2 py-1"
            value={settings.photoH}
            onChange={(e) => setSettings({ photoH: parseFloat(e.target.value) || settings.photoH })}
          />
          <span className="text-ink-soft">mm</span>
        </div>
      )}

      <div className="mt-5 space-y-4">
        <SliderRow label="Page margin" unit="mm" min={0} max={15} step={0.5} value={settings.marginMM}
          onChange={(v) => setSettings({ marginMM: v })} />
        <SliderRow label="Spacing between photos" unit="mm" min={0} max={6} step={0.5} value={settings.gapMM}
          onChange={(v) => setSettings({ gapMM: v })} />
      </div>

      <label className="mt-4 flex items-center justify-between text-[13px]">
        <span>Cut guide lines</span>
        <input
          type="checkbox"
          checked={settings.guides}
          onChange={(e) => setSettings({ guides: e.target.checked })}
          className="h-4 w-4 accent-coral"
        />
      </label>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat label="cols" value={grid.cols} />
        <Stat label="rows" value={grid.rows} />
        <Stat label="photos" value={grid.total} />
      </div>

      <div className="mt-5">
        <div className="mb-2 text-[13px]">Export resolution</div>
        <select
          className="w-full rounded-md border border-line bg-white/70 px-2.5 py-2 text-[13px]"
          value={settings.dpi}
          onChange={(e) => setSettings({ dpi: parseInt(e.target.value) })}
        >
          <option value={300}>300 DPI — print standard</option>
          <option value={600}>600 DPI — ultra</option>
        </select>
      </div>
    </div>
  );
}

function SliderRow({ label, unit, min, max, step, value, onChange }: {
  label: string; unit: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[13px]">
        <span>{label}</span>
        <span className="font-mono text-coral-dark">{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-coral"
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-line bg-white/50 py-2 text-center">
      <div className="font-mono text-lg font-semibold text-teal-dark">{value}</div>
      <div className="text-[9px] uppercase tracking-wide text-ink-soft">{label}</div>
    </div>
  );
}
