import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const FEATURED_EVENTS = [
  {
    id: "evt-1",
    title: "Midnight Premiere Night",
    subtitle: "Exclusive First-Day Screenings",
    description:
      "Experience blockbuster premieres before anyone else — live red-carpet atmosphere, limited seats, signature popcorn buckets included.",
    date: "Fri, Jul 11",
    time: "11:59 PM",
    badge: "PREMIERE",
    badgeColor: "from-rose-600 to-pink-600",
    accentColor: "#f43f5e",
    bgGradient:
      "linear-gradient(135deg, rgba(244,63,94,0.25) 0%, rgba(9,9,11,0) 60%)",
    tags: ["Exclusive", "First Day", "Live Experience"],
    seats: 48,
    price: "₹599",
    image: "/events_banner.png",
    route: "/events",
  },
  {
    id: "evt-2",
    title: "Throwback Cinema Night",
    subtitle: "Classic Films on the Big Screen",
    description:
      "Relive the golden era of cinema — curated screenings of timeless classics with full Dolby Atmos remastered audio and 4K restoration.",
    date: "Sat, Jul 12",
    time: "07:30 PM",
    badge: "CLASSICS",
    badgeColor: "from-amber-500 to-yellow-600",
    accentColor: "#f59e0b",
    bgGradient:
      "linear-gradient(135deg, rgba(245,158,11,0.22) 0%, rgba(9,9,11,0) 60%)",
    tags: ["4K Restoration", "Dolby Atmos", "Curated"],
    seats: 120,
    price: "₹299",
    image: "/cinema_grid_bg.png",
    route: "/events",
  },
  {
    id: "evt-3",
    title: "Director's Cut Screening",
    subtitle: "Uncut & Extended Editions",
    description:
      "Watch the director's vision unfiltered — extended scenes, behind-the-scenes commentary, and a live Q&A with the creative team.",
    date: "Sun, Jul 13",
    time: "05:00 PM",
    badge: "SPECIAL",
    badgeColor: "from-violet-600 to-indigo-600",
    accentColor: "#8b5cf6",
    bgGradient:
      "linear-gradient(135deg, rgba(139,92,246,0.22) 0%, rgba(9,9,11,0) 60%)",
    tags: ["Q&A Session", "Director's Cut", "Exclusive"],
    seats: 75,
    price: "₹449",
    image: "/events_banner.png",
    route: "/events",
  },
  {
    id: "evt-4",
    title: "Horror Movie Marathon",
    subtitle: "All-Night Scare Fest",
    description:
      "5 spine-chilling films back-to-back — from psychological thrillers to supernatural horrors. If you dare, join us for the ultimate scare marathon.",
    date: "Fri, Jul 18",
    time: "10:00 PM",
    badge: "MARATHON",
    badgeColor: "from-red-700 to-rose-800",
    accentColor: "#dc2626",
    bgGradient:
      "linear-gradient(135deg, rgba(220,38,38,0.22) 0%, rgba(9,9,11,0) 60%)",
    tags: ["5 Films", "All Night", "Horror"],
    seats: 200,
    price: "₹799",
    image: "/cinema_grid_bg.png",
    route: "/events",
  },
  {
    id: "evt-5",
    title: "IMAX Science-Fiction Weekend",
    subtitle: "Future Worlds on the Biggest Screen",
    description:
      "Immerse yourself in the worlds of tomorrow — a handpicked selection of the best sci-fi epics projected on full IMAX with cutting-edge sound.",
    date: "Sat–Sun, Jul 19–20",
    time: "03:00 PM",
    badge: "IMAX",
    badgeColor: "from-cyan-500 to-blue-600",
    accentColor: "#06b6d4",
    bgGradient:
      "linear-gradient(135deg, rgba(6,182,212,0.20) 0%, rgba(9,9,11,0) 60%)",
    tags: ["IMAX", "Sci-Fi", "Weekend"],
    seats: 350,
    price: "₹899",
    image: "/events_banner.png",
    route: "/events",
  },
];

function EventSlide({ event, isActive }) {
  const navigate = useNavigate();

  return (
    <div
      className="carousel-slide"
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "24px",
        border: `1px solid ${isActive ? event.accentColor + "40" : "rgba(255,255,255,0.05)"}`,
        background: "rgba(18,18,20,0.85)",
        transition: "all 0.5s ease",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Background image layer */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${event.image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.12,
          filter: "saturate(1.3)",
          transform: "scale(1.05)",
          transition: "transform 8s ease",
        }}
      />

      {/* Gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `${event.bgGradient}, linear-gradient(to right, rgba(9,9,11,0.95) 0%, rgba(9,9,11,0.7) 60%, rgba(9,9,11,0.4) 100%)`,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          padding: "32px",
        }}
      >
        {/* Top Row: badge + seats */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "20px",
          }}
        >
          <span
            style={{
              background: `linear-gradient(135deg, ${event.badgeColor.replace("from-", "").replace("to-", ", ")})`,
              backgroundImage: `linear-gradient(135deg, var(--badge-from), var(--badge-to))`,
              padding: "4px 14px",
              borderRadius: "999px",
              fontSize: "10px",
              fontWeight: "900",
              letterSpacing: "0.15em",
              color: "white",
              textTransform: "uppercase",
              boxShadow: `0 4px 15px ${event.accentColor}40`,
            }}
            className={`bg-linear-to-r ${event.badgeColor}`}
          >
            {event.badge}
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              fontWeight: "700",
              color: "rgba(161,161,170,0.8)",
              background: "rgba(0,0,0,0.3)",
              padding: "4px 12px",
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {event.seats} seats left
          </span>
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: "clamp(1.4rem, 3vw, 2.2rem)",
            fontWeight: "900",
            letterSpacing: "0.02em",
            lineHeight: 1.1,
            color: "#f4f4f5",
            marginBottom: "8px",
            textShadow: "0 2px 20px rgba(0,0,0,0.5)",
          }}
        >
          {event.title}
        </h3>
        <p
          style={{
            fontSize: "12px",
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: event.accentColor,
            marginBottom: "14px",
          }}
        >
          {event.subtitle}
        </p>

        {/* Description */}
        <p
          style={{
            fontSize: "13px",
            color: "rgba(161,161,170,0.85)",
            lineHeight: 1.7,
            marginBottom: "20px",
            flexGrow: 1,
          }}
        >
          {event.description}
        </p>

        {/* Tags */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
            marginBottom: "20px",
          }}
        >
          {event.tags.map((tag) => (
            <span
              key={tag}
              style={{
                padding: "3px 10px",
                borderRadius: "999px",
                fontSize: "10px",
                fontWeight: "700",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                background: `${event.accentColor}15`,
                border: `1px solid ${event.accentColor}30`,
                color: event.accentColor,
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Bottom: date/time + CTA */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          {/* Date & time */}
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                color: "rgba(228,228,231,0.7)",
                fontWeight: "700",
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke={event.accentColor}
                strokeWidth="2.5"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {event.date}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                color: "rgba(228,228,231,0.7)",
                fontWeight: "700",
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke={event.accentColor}
                strokeWidth="2.5"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {event.time}
            </div>
          </div>

          {/* CTA + price */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                fontSize: "16px",
                fontWeight: "900",
                color: event.accentColor,
              }}
            >
              {event.price}
            </span>
            <button
              onClick={() => navigate(event.route)}
              style={{
                padding: "10px 22px",
                borderRadius: "12px",
                background: `linear-gradient(135deg, ${event.accentColor}, ${event.accentColor}cc)`,
                color: "white",
                fontSize: "11px",
                fontWeight: "900",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                border: "none",
                cursor: "pointer",
                boxShadow: `0 6px 20px ${event.accentColor}40`,
                transition: "all 0.25s ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = `0 10px 28px ${event.accentColor}55`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = `0 6px 20px ${event.accentColor}40`;
              }}
            >
              Book Event
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Carousel Component
   ───────────────────────────────────────────── */
export default function EventsCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const intervalRef = useRef(null);

  const total = FEATURED_EVENTS.length;

  const goTo = useCallback(
    (index) => {
      setActiveIndex(((index % total) + total) % total);
    },
    [total],
  );

  const next = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const prev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  // Auto-play
  useEffect(() => {
    if (!isAutoPlaying) return;
    intervalRef.current = setInterval(next, 5000);
    return () => clearInterval(intervalRef.current);
  }, [isAutoPlaying, next]);

  const pauseAutoPlay = () => setIsAutoPlaying(false);
  const resumeAutoPlay = () => setIsAutoPlaying(true);

  // Drag / swipe
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
    pauseAutoPlay();
  };
  const handleMouseUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    const delta = e.clientX - dragStartX;
    if (delta < -50) next();
    else if (delta > 50) prev();
    resumeAutoPlay();
  };
  const handleTouchStart = (e) => setDragStartX(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    const delta = e.changedTouches[0].clientX - dragStartX;
    if (delta < -50) next();
    else if (delta > 50) prev();
  };

  return (
    <section style={{ margin: "0 0 64px 0" }}>
      {/* Section heading */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
          borderBottom: "1px solid rgba(39,39,42,0.8)",
          paddingBottom: "16px",
        }}
      >
        <h3
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "14px",
            fontWeight: "900",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "#f4f4f5",
            margin: 0,
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: "5px",
              height: "22px",
              borderRadius: "999px",
              background: "linear-gradient(180deg, #f43f5e, #e11d48)",
            }}
          />
          🎭 Featured Events & Shows
        </h3>

        {/* Nav arrows */}
        <div style={{ display: "flex", gap: "8px" }}>
          {[
            { onClick: prev, label: "←", dir: "prev" },
            { onClick: next, label: "→", dir: "next" },
          ].map(({ onClick, label, dir }) => (
            <button
              key={dir}
              onClick={onClick}
              onMouseEnter={pauseAutoPlay}
              onMouseLeave={resumeAutoPlay}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(39,39,42,0.8)",
                border: "1px solid rgba(63,63,70,0.8)",
                color: "#a1a1aa",
                fontSize: "16px",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#f43f5e";
                e.currentTarget.style.color = "#f43f5e";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(63,63,70,0.8)";
                e.currentTarget.style.color = "#a1a1aa";
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Carousel viewport */}
      <div
        className="relative overflow-hidden py-6"
        onMouseEnter={pauseAutoPlay}
        onMouseLeave={resumeAutoPlay}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Main slides: show active + 2 side previews */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 2fr 1fr",
            gap: "16px",
            height: "auto",
            userSelect: "none",
          }}
        >
          {/* Left preview */}
          <div
            style={{
              opacity: 0.45,
              transform: "scale(0.96)",
              transition: "all 0.5s ease",
              cursor: "pointer",
              height: "100%",
            }}
            onClick={prev}
          >
            <EventSlide
              event={
                FEATURED_EVENTS[(((activeIndex - 1) % total) + total) % total]
              }
              isActive={false}
            />
          </div>

          {/* Active slide */}
          <div
            style={{
              transform: "scale(1)",
              transition: "all 0.5s ease",
              height: "100%",
              boxShadow: `0 20px 60px ${FEATURED_EVENTS[activeIndex].accentColor}30`,
            }}
          >
            <EventSlide event={FEATURED_EVENTS[activeIndex]} isActive={true} />
          </div>

          {/* Right preview */}
          <div
            style={{
              opacity: 0.45,
              transform: "scale(0.96)",
              transition: "all 0.5s ease",
              cursor: "pointer",
              height: "100%",
            }}
            onClick={next}
          >
            <EventSlide
              event={FEATURED_EVENTS[(activeIndex + 1) % total]}
              isActive={false}
            />
          </div>
        </div>

        {/* Dot indicators */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "8px",
            marginTop: "16px",
          }}
        >
          {FEATURED_EVENTS.map((evt, i) => (
            <button
              key={evt.id}
              onClick={() => {
                goTo(i);
                pauseAutoPlay();
              }}
              style={{
                width: i === activeIndex ? "28px" : "8px",
                height: "8px",
                borderRadius: "999px",
                background:
                  i === activeIndex
                    ? FEATURED_EVENTS[activeIndex].accentColor
                    : "rgba(63,63,70,0.6)",
                border: "none",
                cursor: "pointer",
                transition: "all 0.35s ease",
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
