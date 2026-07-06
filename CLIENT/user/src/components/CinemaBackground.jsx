import React from "react";

/**
 * CinemaBackground - A layered cinematic grid image background with
 * animated overlays, grid mosaic cells, and spotlight effects.
 */
export default function CinemaBackground() {
  // Grid cell positions for the mosaic tiles
  const gridCells = [
    { top: "0%", left: "0%", w: "25%", h: "40%", delay: "0s" },
    { top: "0%", left: "25%", w: "20%", h: "30%", delay: "0.4s" },
    { top: "0%", left: "45%", w: "30%", h: "50%", delay: "0.8s" },
    { top: "0%", left: "75%", w: "25%", h: "35%", delay: "0.2s" },
    { top: "40%", left: "0%", w: "20%", h: "35%", delay: "0.6s" },
    { top: "30%", left: "20%", w: "25%", h: "40%", delay: "1s" },
    { top: "50%", left: "45%", w: "20%", h: "30%", delay: "0.3s" },
    { top: "35%", left: "65%", w: "20%", h: "40%", delay: "0.7s" },
    { top: "35%", left: "85%", w: "15%", h: "30%", delay: "0.5s" },
    { top: "75%", left: "0%", w: "30%", h: "25%", delay: "0.9s" },
    { top: "70%", left: "30%", w: "20%", h: "30%", delay: "0.1s" },
    { top: "80%", left: "50%", w: "25%", h: "20%", delay: "0.6s" },
    { top: "65%", left: "75%", w: "25%", h: "35%", delay: "0.4s" },
  ];

  // Accent colors for cell borders/glow
  const accentColors = [
    "rgba(244,63,94,0.15)",
    "rgba(99,102,241,0.12)",
    "rgba(251,191,36,0.10)",
    "rgba(34,211,238,0.08)",
    "rgba(244,63,94,0.12)",
    "rgba(167,139,250,0.10)",
    "rgba(244,63,94,0.15)",
    "rgba(99,102,241,0.10)",
    "rgba(251,191,36,0.08)",
    "rgba(244,63,94,0.12)",
    "rgba(34,211,238,0.10)",
    "rgba(244,63,94,0.15)",
    "rgba(99,102,241,0.12)",
  ];

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
    >
      {/* Base image */}
      <div className="absolute inset-0 bg-[url(/cinema_grid_bg.png)] bg-cover bg-center bg-no-repeat opacity-[0.08] scale-[1.05] saturate-[1.4] brightness-[0.85]" />

      {/* Dark overlay gradient */}
      <div className="absolute inset-0 bg-linear-to-br from-zinc-950/97 via-zinc-950/88 to-zinc-950/95" />

      {/* Mosaic grid cells - individual image tiles with subtle glow */}
      {gridCells.map((cell, i) => (
        <div
          key={i}
          className="absolute bg-[url(/cinema_grid_bg.png)] bg-cover opacity-0 rounded-[4px] saturate-[1.2]"
          style={{
            top: cell.top,
            left: cell.left,
            width: cell.w,
            height: cell.h,
            backgroundPosition: `${(i * 17) % 100}% ${(i * 23) % 100}%`,
            border: `1px solid ${accentColors[i]}`,
            animation: `cinemaGridCell 8s ease-in-out infinite`,
            animationDelay: cell.delay,
          }}
        />
      ))}

      {/* Film strip decoration lines (horizontal) */}
      <div className="absolute top-[15%] left-0 right-0 h-px bg-linear-to-r from-transparent via-rose-500/12 to-transparent" />
      <div className="absolute top-[60%] left-0 right-0 h-px bg-linear-to-r from-transparent via-indigo-500/10 to-transparent" />

      {/* Vertical separator lines like film strips */}
      {[15, 35, 55, 75].map((pos, i) => (
        <div
          key={i}
          className="absolute top-0 bottom-0 w-[1px] bg-linear-to-b from-transparent via-white/4 to-transparent"
          style={{
            left: `${pos}%`,
          }}
        />
      ))}

      {/* Top center spotlight projector beam */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-500/10 via-rose-500/4 to-transparent blur-[20px] pointer-events-none" />

      {/* Bottom ambient glow */}
      <div className="absolute bottom-0 left-0 right-0 h-[300px] bg-linear-to-t from-zinc-950 to-transparent" />

      {/* Animated keyframe style injected inline via a style tag approach */}
      <style>{`
        @keyframes cinemaGridCell {
          0%   { opacity: 0; }
          15%  { opacity: 0.07; }
          50%  { opacity: 0.12; }
          85%  { opacity: 0.07; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
