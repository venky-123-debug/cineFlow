import React from "react";

/**
 * CinemaBackground - A layered cinematic grid image background with
 * animated overlays, grid mosaic cells, and spotlight effects.
 */
export default function CinemaBackground() {
  // Grid cell positions for the mosaic tiles
  const gridCells = [
    { top: "0%",  left: "0%",   w: "25%", h: "40%", delay: "0s" },
    { top: "0%",  left: "25%",  w: "20%", h: "30%", delay: "0.4s" },
    { top: "0%",  left: "45%",  w: "30%", h: "50%", delay: "0.8s" },
    { top: "0%",  left: "75%",  w: "25%", h: "35%", delay: "0.2s" },
    { top: "40%", left: "0%",   w: "20%", h: "35%", delay: "0.6s" },
    { top: "30%", left: "20%",  w: "25%", h: "40%", delay: "1s"   },
    { top: "50%", left: "45%",  w: "20%", h: "30%", delay: "0.3s" },
    { top: "35%", left: "65%",  w: "20%", h: "40%", delay: "0.7s" },
    { top: "35%", left: "85%",  w: "15%", h: "30%", delay: "0.5s" },
    { top: "75%", left: "0%",   w: "30%", h: "25%", delay: "0.9s" },
    { top: "70%", left: "30%",  w: "20%", h: "30%", delay: "0.1s" },
    { top: "80%", left: "50%",  w: "25%", h: "20%", delay: "0.6s" },
    { top: "65%", left: "75%",  w: "25%", h: "35%", delay: "0.4s" },
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
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {/* Base image */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url(/cinema_grid_bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          opacity: 0.08,
          transform: "scale(1.05)",
          filter: "saturate(1.4) brightness(0.85)",
        }}
      />

      {/* Dark overlay gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, rgba(9,9,11,0.97) 0%, rgba(9,9,11,0.88) 50%, rgba(9,9,11,0.95) 100%)",
        }}
      />

      {/* Mosaic grid cells - individual image tiles with subtle glow */}
      {gridCells.map((cell, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: cell.top,
            left: cell.left,
            width: cell.w,
            height: cell.h,
            backgroundImage: "url(/cinema_grid_bg.png)",
            backgroundSize: "cover",
            backgroundPosition: `${(i * 17) % 100}% ${(i * 23) % 100}%`,
            opacity: 0,
            border: `1px solid ${accentColors[i]}`,
            borderRadius: "4px",
            animation: `cinemaGridCell 8s ease-in-out infinite`,
            animationDelay: cell.delay,
            filter: "saturate(1.2)",
          }}
        />
      ))}

      {/* Film strip decoration lines (horizontal) */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          left: 0,
          right: 0,
          height: "1px",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(244,63,94,0.06) 30%, rgba(244,63,94,0.12) 50%, rgba(244,63,94,0.06) 70%, transparent 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "60%",
          left: 0,
          right: 0,
          height: "1px",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.05) 30%, rgba(99,102,241,0.10) 50%, rgba(99,102,241,0.05) 70%, transparent 100%)",
        }}
      />

      {/* Vertical separator lines like film strips */}
      {[15, 35, 55, 75].map((pos, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${pos}%`,
            width: "1px",
            background:
              "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.02) 30%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.02) 70%, transparent 100%)",
          }}
        />
      ))}

      {/* Top center spotlight projector beam */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "900px",
          height: "500px",
          background:
            "radial-gradient(ellipse at top, rgba(244,63,94,0.10) 0%, rgba(244,63,94,0.04) 30%, transparent 70%)",
          filter: "blur(20px)",
          pointerEvents: "none",
        }}
      />

      {/* Bottom ambient glow */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "300px",
          background:
            "linear-gradient(to top, rgba(9,9,11,1) 0%, transparent 100%)",
        }}
      />

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
