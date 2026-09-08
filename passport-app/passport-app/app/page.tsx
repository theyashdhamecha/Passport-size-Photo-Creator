'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';

/* ---------- constants ---------- */
const A4_W = 210, A4_H = 297;
const PRESETS = [
  { id: '35x45', label: '35 × 45 mm — India / UK / EU / AU', w: 35, h: 45 },
  { id: '2x2in', label: '2 × 2 in — US / Philippines', w: 50.8, h: 50.8 },
  { id: '50x70', label: '50 × 70 mm — Canada', w: 50, h: 70 },
  { id: '33x48', label: '33 × 48 mm — China', w: 33, h: 48 },
];

interface Photo {
  id: string;
  url: string;
  name: string;
  count: number;
  zoom: number;
  panX: number; // %
  panY: number; // %
}
interface Override { zoom?: number; panX?: number; panY?: number; }

const uid = () => Math.random().toString(36).slice(2, 10);

/* ---------- component ---------- */
export default function PassportSheet() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [slots, setSlots] = useState<(string | null)[]>([]);
  const [overrides, setOverrides] = useState<Record<number, Override>>({});
  const [presetId, setPresetId] = useState('35x45');
  const [customW, setCustomW] = useState(35);
  const [customH, setCustomH] = useState(45);
  const [margin, setMargin] = useState(5);
  const [gap, setGap] = useState(2);
  const [showGuides, setShowGuides] = useState(true);
  const [dark, setDark] = useState(false);
  const [fileName, setFileName] = useState('passport-sheet');
  const [dpi, setDpi] = useState<300 | 600>(300);
  const [format, setFormat] = useState<'png' | 'jpeg' | 'pdf'>('png');
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragSrc, setDragSrc] = useState<number | null>(null);
  const dragPos = useRef({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const preset = presetId === 'custom'
    ? { w: customW, h: customH }
    : PRESETS.find(p => p.id === presetId)!;

  const cols = Math.max(1, Math.floor((A4_W - 2 * margin + gap) / (preset.w + gap)));
  const rows = Math.max(1, Math.floor((A4_H - 2 * margin + gap) / (preset.h + gap)));
  const maxSlots = cols * rows;

  const gridW = cols * preset.w + (cols - 1) * gap;
  const gridH = rows * preset.h + (rows - 1) * gap;
  const marginX = (A4_W - gridW) / 2;
  const marginY = (A4_H - gridH) / 2;

  const total = photos.reduce((s, p) => s + p.count, 0);

  useEffect(() => {
    const list: (string | null)[] = [];
    photos.forEach(p => { for (let i = 0; i < p.count && list.length < maxSlots; i++) list.push(p.id); });
    while (list.length < maxSlots) list.push(null);
    setSlots(list.slice(0, maxSlots));
  }, [photos, maxSlots]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const upload = (files: FileList | null) => {
    if (!files) return;
    const items: Photo[] = Array.from(files).map(f => ({
      id: uid(), url: URL.createObjectURL(f), name: f.name, count: 1, zoom: 1, panX: 0, panY: 0,
    }));
    setPhotos(prev => [...prev, ...items]);
  };

  const setCount = (id: string, n: number) => {
    setPhotos(prev => {
      const others = prev.reduce((s, p) => p.id === id ? s : s + p.count, 0);
      const capped = Math.max(0, Math.min(n, maxSlots - others));
      return prev.map(p => p.id === id ? { ...p, count: capped } : p);
    });
  };
  const fillAll = (id: string) => {
    setPhotos(prev => {
      const others = prev.reduce((s, p) => p.id === id ? s : s + p.count, 0);
      return prev.map(p => p.id === id ? { ...p, count: Math.max(0, maxSlots - others) } : p);
    });
  };
  const remove = (id: string) => setPhotos(prev => prev.filter(p => p.id !== id));

  const swap = (i: number, j: number) => {
    setSlots(prev => {
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const editing = photos.find(p => p.id === editingId) || null;

  const onModalDrag = (e: React.MouseEvent) => {
    if (!dragging || !editing) return;
    const dx = (e.movementX / 200) * 100;
    const dy = (e.movementY / 200) * 100;
    setPhotos(prev => prev.map(p => p.id === editing.id
      ? { ...p, panX: Math.max(-50, Math.min(50, p.panX + dx)), panY: Math.max(-50, Math.min(50, p.panY + dy)) }
      : p));
  };

  /* ---- export ---- */
  const buildCanvas = useCallback(async (dpiVal: number) => {
    const scale = dpiVal / 25.4;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(A4_W * scale);
    canvas.height = Math.round(A4_H * scale);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const imgs = new Map<string, HTMLImageElement>();
    for (const p of photos) {
      await new Promise<void>(res => {
        const img = new Image();
        img.onload = () => { imgs.set(p.id, img); res(); };
        img.src = p.url;
      });
    }

    const cw = preset.w * scale, ch = preset.h * scale, gp = gap * scale;
    const sx = marginX * scale, sy = marginY * scale;

    slots.forEach((id, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x = sx + col * (cw + gp), y = sy + row * (ch + gp);
      const photo = photos.find(p => p.id === id);
      const img = photo ? imgs.get(photo.id) : null;
      if (photo && img) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, cw, ch);
        ctx.clip();
        const ov = overrides[i] || {};
        const zoom = ov.zoom ?? photo.zoom, panX = ov.panX ?? photo.panX, panY = ov.panY ?? photo.panY;
        const imgAspect = img.width / img.height, cellAspect = cw / ch;
        let bw = cw, bh = ch;
        if (imgAspect > cellAspect) bw = ch * imgAspect; else bh = cw / imgAspect;
        const dw = bw * zoom, dh = bh * zoom;
        const dx = x + (cw - dw) / 2 + (panX / 100) * cw;
        const dy = y + (ch - dh) / 2 + (panY / 100) * ch;
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();
      }
      if (showGuides) {
        ctx.lineWidth = Math.max(1, 0.12 * scale);
        ctx.strokeStyle = '#BBBBBB';
        ctx.strokeRect(x, y, cw, ch);
      }
    });
    return canvas;
  }, [photos, slots, cols, gap, marginX, marginY, preset, overrides, showGuides]);

  const doExport = async () => {
    setBusy(true);
    try {
      const canvas = await buildCanvas(dpi);
      const name = fileName.trim() || 'passport-sheet';
      if (format === 'pdf') {
        const { jsPDF } = await import('jspdf');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [A4_W, A4_H] });
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, A4_W, A4_H);
        pdf.save(`${name}.pdf`);
      } else {
        const link = document.createElement('a');
        link.download = `${name}.${format}`;
        link.href = canvas.toDataURL(`image/${format}`, format === 'jpeg' ? 0.95 : undefined);
        link.click();
      }
    } finally { setBusy(false); }
  };

  /* ---- theme tokens (avoid generic AI palette) ---- */
  const T = dark
    ? { bg: '#12120F', panel: '#1B1A16', border: '#2E2C25', ink: '#EDE9DE', muted: '#9A9585', accent: '#C97A3A', accent2: '#5E8B7E' }
    : { bg: '#F6F3EC', panel: '#FFFFFF', border: '#E3DDCC', ink: '#231F18', muted: '#7A7261', accent: '#B5542A', accent2: '#3E7A6B' };

  return (
    <div style={{ background: T.bg, color: T.ink, minHeight: '100vh', fontFamily: 'Georgia, "Iowan Old Style", serif' }}
      className="transition-colors duration-200">
      <style>{`
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
        .mono{font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace}
      `}</style>

      {/* header */}
      <header style={{ borderBottom: `1px solid ${T.border}`, background: T.panel }} className="px-5 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-baseline gap-3">
          <span className="mono text-xs px-1.5 py-0.5 rounded-sm" style={{ background: T.accent, color: '#fff' }}>{preset.w}×{preset.h}</span>
          <h1 className="text-lg" style={{ letterSpacing: '-0.01em' }}>Proof Sheet</h1>
        </div>
        <button onClick={() => setDark(d => !d)} style={{ border: `1px solid ${T.border}` }} className="text-xs px-3 py-1.5 rounded-sm mono">
          {dark ? 'light' : 'dark'}
        </button>
      </header>

      <div className="flex flex-col lg:flex-row">
        {/* sidebar */}
        <aside style={{ borderRight: `1px solid ${T.border}`, background: T.panel }} className="w-full lg:w-[380px] p-5 flex flex-col gap-6 lg:max-h-[calc(100vh-57px)] lg:overflow-y-auto">

          <div>
            <label className="text-xs mono uppercase" style={{ color: T.muted }}>photo standard</label>
            <select value={presetId} onChange={e => setPresetId(e.target.value)}
              style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.ink }}
              className="w-full mt-1.5 text-sm px-2.5 py-2 rounded-sm">
              {PRESETS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              <option value="custom">Custom size…</option>
            </select>
            {presetId === 'custom' && (
              <div className="flex gap-2 mt-2">
                <input type="number" value={customW} onChange={e => setCustomW(+e.target.value)} placeholder="w mm"
                  style={{ border: `1px solid ${T.border}`, background: T.bg }} className="w-1/2 text-sm px-2 py-1.5 rounded-sm mono" />
                <input type="number" value={customH} onChange={e => setCustomH(+e.target.value)} placeholder="h mm"
                  style={{ border: `1px solid ${T.border}`, background: T.bg }} className="w-1/2 text-sm px-2 py-1.5 rounded-sm mono" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <label className="text-xs mono" style={{ color: T.muted }}>margin (mm)</label>
              <input type="number" value={margin} onChange={e => setMargin(+e.target.value)}
                style={{ border: `1px solid ${T.border}`, background: T.bg }} className="w-full mt-1 px-2 py-1.5 rounded-sm mono" />
            </div>
            <div>
              <label className="text-xs mono" style={{ color: T.muted }}>gap (mm)</label>
              <input type="number" value={gap} onChange={e => setGap(+e.target.value)}
                style={{ border: `1px solid ${T.border}`, background: T.bg }} className="w-full mt-1 px-2 py-1.5 rounded-sm mono" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showGuides} onChange={e => setShowGuides(e.target.checked)} />
            cut guide lines
          </label>

          <div style={{ border: `1px solid ${T.border}` }} className="p-3 rounded-sm">
            <div className="flex justify-between text-xs mono mb-1">
              <span>capacity</span>
              <span style={{ color: total > maxSlots ? T.accent : total === maxSlots ? T.accent2 : T.muted }}>{total} / {maxSlots}</span>
            </div>
            <div style={{ background: T.border }} className="h-1 rounded-full overflow-hidden">
              <div style={{ width: `${Math.min(100, (total / maxSlots) * 100)}%`, background: total > maxSlots ? T.accent : T.accent2 }} className="h-full transition-all" />
            </div>
          </div>

          <label style={{ border: `1px dashed ${T.border}` }} className="rounded-sm p-5 flex flex-col items-center gap-1 cursor-pointer text-sm">
            + upload photos
            <span className="text-xs" style={{ color: T.muted }}>one or several, mixed sheets ok</span>
            <input type="file" multiple accept="image/*" className="hidden" onChange={e => upload(e.target.files)} />
          </label>

          <div className="flex flex-col gap-2">
            {photos.length === 0 && <p className="text-xs" style={{ color: T.muted }}>No photos yet.</p>}
            {photos.map(p => (
              <div key={p.id} style={{ border: `1px solid ${T.border}` }} className="p-2.5 rounded-sm flex items-center gap-2.5">
                <img src={p.url} className="w-9 h-11 object-cover rounded-sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate mb-1.5">{p.name}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <div style={{ border: `1px solid ${T.border}` }} className="flex items-center rounded-sm">
                      <button onClick={() => setCount(p.id, p.count - 1)} className="px-1.5 py-0.5">−</button>
                      <input type="number" value={p.count} onChange={e => setCount(p.id, +e.target.value || 0)}
                        className="w-8 text-center text-xs mono bg-transparent" />
                      <button onClick={() => setCount(p.id, p.count + 1)} className="px-1.5 py-0.5">+</button>
                    </div>
                    <button onClick={() => fillAll(p.id)} style={{ color: T.accent }} className="text-[11px] mono">fill all</button>
                    <button onClick={() => setEditingId(p.id)} style={{ color: T.accent2 }} className="text-[11px] mono">edit</button>
                    <button onClick={() => remove(p.id)} style={{ color: T.muted }} className="text-[11px] mono">remove</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: `1px solid ${T.border}` }} className="pt-4 flex flex-col gap-2.5">
            <label className="text-xs mono uppercase" style={{ color: T.muted }}>export</label>
            <input value={fileName} onChange={e => setFileName(e.target.value)} placeholder="file name"
              style={{ border: `1px solid ${T.border}`, background: T.bg }} className="text-sm px-2.5 py-2 rounded-sm" />
            <div className="flex gap-2">
              {(['png', 'jpeg', 'pdf'] as const).map(f => (
                <button key={f} onClick={() => setFormat(f)}
                  style={{ border: `1px solid ${T.border}`, background: format === f ? T.accent : 'transparent', color: format === f ? '#fff' : T.ink }}
                  className="flex-1 text-xs mono py-1.5 rounded-sm uppercase">{f}</button>
              ))}
            </div>
            <div className="flex gap-2">
              {[300, 600].map(d => (
                <button key={d} onClick={() => setDpi(d as 300 | 600)}
                  style={{ border: `1px solid ${T.border}`, background: dpi === d ? T.accent2 : 'transparent', color: dpi === d ? '#fff' : T.ink }}
                  className="flex-1 text-xs mono py-1.5 rounded-sm">{d} dpi</button>
              ))}
            </div>
            <button onClick={doExport} disabled={busy || total === 0}
              style={{ background: T.accent }} className="text-white text-sm py-2.5 rounded-sm disabled:opacity-40">
              {busy ? 'rendering…' : `download ${format.toUpperCase()}`}
            </button>
          </div>
        </aside>

        {/* preview */}
        <main className="flex-1 flex items-center justify-center p-6 overflow-auto">
          <div style={{
            width: '100%', maxWidth: 620, aspectRatio: `${A4_W}/${A4_H}`, background: '#fff',
            boxShadow: '0 2px 24px rgba(0,0,0,0.15)',
            padding: `${(marginY / A4_H) * 100}% ${(marginX / A4_W) * 100}%`,
          }}>
            <div className="w-full h-full grid" style={{
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gridTemplateRows: `repeat(${rows}, 1fr)`,
              gap: `${(gap / A4_W) * 100}%`,
            }}>
              {slots.map((id, i) => {
                const photo = photos.find(p => p.id === id);
                const ov = overrides[i] || {};
                return (
                  <div key={i}
                    draggable={!!photo}
                    onDragStart={() => setDragSrc(i)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => { if (dragSrc !== null) swap(dragSrc, i); setDragSrc(null); }}
                    style={{ aspectRatio: `${preset.w}/${preset.h}`, border: showGuides ? '1px solid #C9C9C9' : '1px dashed #E5E5E5' }}
                    className="relative overflow-hidden bg-[#FAFAFA] flex items-center justify-center">
                    {photo ? (
                      <img src={photo.url} className="absolute w-full h-full object-cover pointer-events-none" style={{
                        transform: `scale(${ov.zoom ?? photo.zoom}) translate(${ov.panX ?? photo.panX}%, ${ov.panY ?? photo.panY}%)`,
                      }} />
                    ) : <span className="text-[9px] mono text-[#CCC]">{i + 1}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      {/* edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-30">
          <div style={{ background: T.panel, border: `1px solid ${T.border}` }} className="w-full max-w-sm p-5 rounded-sm flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm">Adjust crop</h3>
              <button onClick={() => setEditingId(null)} className="text-xs" style={{ color: T.muted }}>close</button>
            </div>
            <div
              onMouseDown={() => setDragging(true)}
              onMouseUp={() => setDragging(false)}
              onMouseLeave={() => setDragging(false)}
              onMouseMove={onModalDrag}
              className="relative w-full bg-black rounded-sm overflow-hidden cursor-move"
              style={{ aspectRatio: `${preset.w}/${preset.h}` }}>
              <img src={editing.url} draggable={false} className="absolute w-full h-full object-cover select-none" style={{
                transform: `scale(${editing.zoom}) translate(${editing.panX}%, ${editing.panY}%)`,
              }} />
            </div>
            <div>
              <div className="flex justify-between text-xs mono mb-1"><span>zoom</span><span>{Math.round(editing.zoom * 100)}%</span></div>
              <input type="range" min={0.8} max={3} step={0.05} value={editing.zoom}
                onChange={e => setPhotos(prev => prev.map(p => p.id === editing.id ? { ...p, zoom: +e.target.value } : p))}
                className="w-full" />
            </div>
            <p className="text-[11px]" style={{ color: T.muted }}>Drag the image to reposition. Applies to every slot using this photo.</p>
            <button onClick={() => setEditingId(null)} style={{ background: T.accent }} className="text-white text-sm py-2 rounded-sm">Apply</button>
          </div>
        </div>
      )}
    </div>
  );
}
