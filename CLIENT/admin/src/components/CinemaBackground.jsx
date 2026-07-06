import React from "react";

/**
 * CinemaBackground (Admin variant)
 * Layered cinematic mosaic background with amber/gold admin accent tones,
 * animated grid cells, film-strip lines, and spotlight effects.
 */
export default function CinemaBackground() {
  const gridCells = [
    { top: "0%", left: "0%", w: "25%", h: "40%", delay: "0s" },
    { top: "0%", left: "25%", w: "20%", h: "30%", delay: "0.5s" },
    { top: "0%", left: "45%", w: "30%", h: "50%", delay: "0.9s" },
    { top: "0%", left: "75%", w: "25%", h: "35%", delay: "0.2s" },
    { top: "40%", left: "0%", w: "20%", h: "35%", delay: "0.7s" },
    { top: "30%", left: "20%", w: "25%", h: "40%", delay: "1.1s" },
    { top: "50%", left: "45%", w: "20%", h: "30%", delay: "0.3s" },
    { top: "35%", left: "65%", w: "20%", h: "40%", delay: "0.8s" },
    { top: "35%", left: "85%", w: "15%", h: "30%", delay: "0.4s" },
    { top: "75%", left: "0%", w: "30%", h: "25%", delay: "1.0s" },
    { top: "70%", left: "30%", w: "20%", h: "30%", delay: "0.1s" },
    { top: "80%", left: "50%", w: "25%", h: "20%", delay: "0.6s" },
    { top: "65%", left: "75%", w: "25%", h: "35%", delay: "0.4s" },
  ];

  // Admin accent palette: amber/gold + indigo
  const accentColors = [
    "rgba(245,158,11,0.15)",
    "rgba(99,102,241,0.12)",
    "rgba(251,191,36,0.12)",
    "rgba(244,63,94,0.08)",
    "rgba(245,158,11,0.12)",
    "rgba(167,139,250,0.10)",
    "rgba(245,158,11,0.15)",
    "rgba(99,102,241,0.10)",
    "rgba(251,191,36,0.08)",
    "rgba(245,158,11,0.12)",
    "rgba(34,211,238,0.08)",
    "rgba(245,158,11,0.15)",
    "rgba(99,102,241,0.10)",
  ];

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
    >
      {/* Base image */}
      <div className="absolute inset-0 bg-[url(/cinema_grid_bg.png)] bg-cover bg-center bg-no-repeat opacity-[0.07] scale-[1.05] saturate-[1.2] brightness-[0.8]" />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-linear-to-br from-zinc-950/97 via-zinc-950/90 to-zinc-950/96" />

      {/* Mosaic grid cells */}
      {gridCells.map((cell, i) => (
        <div
          key={i}
          className="absolute bg-[url(/cinema_grid_bg.png)] bg-cover opacity-0 rounded-[4px] saturate-[1.1] sepia-[0.15]"
          style={{
            top: cell.top,
            left: cell.left,
            width: cell.w,
            height: cell.h,
            backgroundPosition: `${(i * 19) % 100}% ${(i * 27) % 100}%`,
            border: `1px solid ${accentColors[i]}`,
            animation: `adminGridCell 9s ease-in-out infinite`,
            animationDelay: cell.delay,
          }}
        />
      ))}

      {/* Horizontal film-strip accent lines */}
      <div className="absolute top-[20%] left-0 right-0 h-px bg-linear-to-r from-transparent via-amber-500/12 to-transparent" />
      <div className="absolute top-[65%] left-0 right-0 h-px bg-linear-to-r from-transparent via-indigo-500/9 to-transparent" />

      {/* Vertical separator lines */}
      {[20, 40, 60, 80].map((pos, i) => (
        <div
          key={i}
          className="absolute top-0 bottom-0 w-px bg-linear-to-b from-transparent via-white/3 to-transparent"
          style={{
            left: `${pos}%`,
          }}
        />
      ))}

      {/* Top-center amber spotlight projector beam */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[440px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/8 via-amber-500/3 to-transparent blur-[24px]" />

      {/* Left edge indigo ambient glow */}
      <div className="absolute top-[20%] left-0 w-[300px] h-[400px] bg-[radial-gradient(ellipse_at_left,_var(--tw-gradient-stops))] from-indigo-500/6 to-transparent blur-[30px]" />

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-[250px] bg-linear-to-t from-zinc-950 to-transparent" />

      <style>{`
        @keyframes adminGridCell {
          0%   { opacity: 0; }
          15%  { opacity: 0.06; }
          50%  { opacity: 0.11; }
          85%  { opacity: 0.06; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
