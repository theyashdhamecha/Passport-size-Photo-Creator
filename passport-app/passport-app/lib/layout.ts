export const MM_PER_IN = 25.4;
export const PAGE_W_MM = 210;
export const PAGE_H_MM = 297;

export const PRESETS: Record<string, [number, number, string]> = {
  "35x45": [35, 45, "35 × 45 mm — India / UK / EU / AU"],
  "51x51": [50.8, 50.8, "2 × 2 in — US / Philippines"],
  "50x70": [50, 70, "50 × 70 mm — Canada"],
  "33x48": [33, 48, "33 × 48 mm — China"],
};

export interface SheetSettings {
  photoW: number;
  photoH: number;
  marginMM: number;
  gapMM: number;
  guides: boolean;
  dpi: number;
}

export function computeGrid(s: SheetSettings) {
  const usableW = PAGE_W_MM - s.marginMM * 2;
  const usableH = PAGE_H_MM - s.marginMM * 2;
  const cellW = s.photoW + s.gapMM;
  const cellH = s.photoH + s.gapMM;
  const cols = Math.max(1, Math.floor((usableW + s.gapMM) / cellW));
  const rows = Math.max(1, Math.floor((usableH + s.gapMM) / cellH));
  return { cols, rows, total: cols * rows };
}

export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function requiredPx(mm: number, dpi: number) {
  return Math.round((mm / MM_PER_IN) * dpi);
}
