"use client";
// Placeholder ad unit. Swap the inner div for your real ad network's
// embed code (e.g. Google AdSense <ins class="adsbygoogle">) once approved.
// Sizes follow common IAB units so real ads drop in without layout shift.
export default function AdSlot({ variant }: { variant: "leaderboard" | "rectangle" }) {
  const dims = variant === "leaderboard" ? "h-[90px] w-full max-w-[728px]" : "h-[250px] w-[300px]";
  return (
    <div
      className={`${dims} mx-auto flex items-center justify-center rounded-md border border-dashed border-line bg-paper-2 text-[11px] font-mono text-ink-soft/60`}
      aria-hidden="true"
    >
      ad space — {variant}
    </div>
  );
}
