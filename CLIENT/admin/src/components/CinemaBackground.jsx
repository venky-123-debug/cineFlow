import React from "react";

/**
 * CinemaBackground (Admin variant)
 * Layered cinematic mosaic background with amber/gold admin accent tones,
 * animated grid cells, film-strip lines, and spotlight effects.
 */
export default function CinemaBackground() {
  const gridCells = [
    { top: "0%",  left: "0%",   w: "25%", h: "40%", delay: "0s" },
    { top: "0%",  left: "25%",  w: "20%", h: "30%", delay: "0.5s" },
    { top: "0%",  left: "45%",  w: "30%", h: "50%", delay: "0.9s" },
    { top: "0%",  left: "75%",  w: "25%", h: "35%", delay: "0.2s" },
    { top: "40%", left: "0%",   w: "20%", h: "35%", delay: "0.7s" },
    { top: "30%", left: "20%",  w: "25%", h: "40%", delay: "1.1s" },
    { top: "50%", left: "45%",  w: "20%", h: "30%", delay: "0.3s" },
    { top: "35%", left: "65%",  w: "20%", h: "40%", delay: "0.8s" },
    { top: "35%", left: "85%",  w: "15%", h: "30%", delay: "0.4s" },
    { top: "75%", left: "0%",   w: "30%", h: "25%", delay: "1.0s" },
    { top: "70%", left: "30%",  w: "20%", h: "30%", delay: "0.1s" },
    { top: "80%", left: "50%",  w: "25%", h: "20%", delay: "0.6s" },
    { top: "65%", left: "75%",  w: "25%", h: "35%", delay: "0.4s" },
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
          opacity: 0.07,
          transform: "scale(1.05)",
          filter: "saturate(1.2) brightness(0.8)",
        }}
      />

      {/* Dark overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, rgba(9,9,11,0.97) 0%, rgba(9,9,11,0.90) 50%, rgba(9,9,11,0.96) 100%)",
        }}
      />

      {/* Mosaic grid cells */}
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
            backgroundPosition: `${(i * 19) % 100}% ${(i * 27) % 100}%`,
            opacity: 0,
            border: `1px solid ${accentColors[i]}`,
            borderRadius: "4px",
            animation: `adminGridCell 9s ease-in-out infinite`,
            animationDelay: cell.delay,
            filter: "saturate(1.1) sepia(0.15)",
          }}
        />
      ))}

      {/* Horizontal film-strip accent lines */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: 0,
          right: 0,
          height: "1px",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(245,158,11,0.06) 30%, rgba(245,158,11,0.12) 50%, rgba(245,158,11,0.06) 70%, transparent 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "65%",
          left: 0,
          right: 0,
          height: "1px",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.05) 30%, rgba(99,102,241,0.09) 50%, rgba(99,102,241,0.05) 70%, transparent 100%)",
        }}
      />

      {/* Vertical separator lines */}
      {[20, 40, 60, 80].map((pos, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${pos}%`,
            width: "1px",
            background:
              "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.018) 35%, rgba(255,255,255,0.035) 50%, rgba(255,255,255,0.018) 65%, transparent 100%)",
          }}
        />
      ))}

      {/* Top-center amber spotlight projector beam */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "800px",
          height: "440px",
          background:
            "radial-gradient(ellipse at top, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.03) 35%, transparent 70%)",
          filter: "blur(24px)",
        }}
      />

      {/* Left edge indigo ambient glow */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: 0,
          width: "300px",
          height: "400px",
          background:
            "radial-gradient(ellipse at left, rgba(99,102,241,0.06) 0%, transparent 70%)",
          filter: "blur(30px)",
        }}
      />

      {/* Bottom fade */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "250px",
          background:
            "linear-gradient(to top, rgba(9,9,11,1) 0%, transparent 100%)",
        }}
      />

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
