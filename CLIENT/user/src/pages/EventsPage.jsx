import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import CinemaBackground from "../components/CinemaBackground";

const ALL_EVENTS = [
  {
    id: "evt-1",
    title: "Midnight Premiere Night",
    subtitle: "Exclusive First-Day Screenings",
    description:
      "Experience blockbuster premieres before anyone else — live red-carpet atmosphere, limited seats, signature popcorn buckets included.",
    date: "Fri, Jul 11",
    time: "11:59 PM",
    badge: "PREMIERE",
    category: "Premiere",
    accentColor: "#f43f5e",
    badgeGradient: "linear-gradient(135deg,#f43f5e,#db2777)",
    tags: ["Exclusive", "First Day", "Live Experience"],
    seats: 48,
    price: "₹599",
    image: "/events_banner.png",
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
    category: "Classics",
    accentColor: "#f59e0b",
    badgeGradient: "linear-gradient(135deg,#f59e0b,#d97706)",
    tags: ["4K Restoration", "Dolby Atmos", "Curated"],
    seats: 120,
    price: "₹299",
    image: "/cinema_grid_bg.png",
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
    category: "Special",
    accentColor: "#8b5cf6",
    badgeGradient: "linear-gradient(135deg,#8b5cf6,#6d28d9)",
    tags: ["Q&A Session", "Director's Cut", "Exclusive"],
    seats: 75,
    price: "₹449",
    image: "/events_banner.png",
  },
  {
    id: "evt-4",
    title: "Horror Movie Marathon",
    subtitle: "All-Night Scare Fest",
    description:
      "5 spine-chilling films back-to-back — from psychological thrillers to supernatural horrors. Join us for the ultimate scare marathon.",
    date: "Fri, Jul 18",
    time: "10:00 PM",
    badge: "MARATHON",
    category: "Marathon",
    accentColor: "#dc2626",
    badgeGradient: "linear-gradient(135deg,#dc2626,#991b1b)",
    tags: ["5 Films", "All Night", "Horror"],
    seats: 200,
    price: "₹799",
    image: "/cinema_grid_bg.png",
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
    category: "Special",
    accentColor: "#06b6d4",
    badgeGradient: "linear-gradient(135deg,#06b6d4,#0284c7)",
    tags: ["IMAX", "Sci-Fi", "Weekend"],
    seats: 350,
    price: "₹899",
    image: "/events_banner.png",
  },
  {
    id: "evt-6",
    title: "Indie Film Showcase",
    subtitle: "Stories Beyond the Mainstream",
    description:
      "A celebration of independent cinema — raw storytelling, authentic performances, and an evening mixer with the filmmakers.",
    date: "Thu, Jul 24",
    time: "06:30 PM",
    badge: "INDIE",
    category: "Indie",
    accentColor: "#10b981",
    badgeGradient: "linear-gradient(135deg,#10b981,#059669)",
    tags: ["Indie Cinema", "Mixer", "Discussion"],
    seats: 90,
    price: "₹249",
    image: "/cinema_grid_bg.png",
  },
  {
    id: "evt-7",
    title: "Bollywood Legends Night",
    subtitle: "Iconic Films Reimagined Live",
    description:
      "An unforgettable evening celebrating Bollywood classics with live orchestral score, sing-alongs, and exclusive behind-the-scenes footage.",
    date: "Sat, Jul 26",
    time: "08:00 PM",
    badge: "BOLLYWOOD",
    category: "Bollywood",
    accentColor: "#f97316",
    badgeGradient: "linear-gradient(135deg,#f97316,#ea580c)",
    tags: ["Live Orchestra", "Sing-Along", "Bollywood"],
    seats: 500,
    price: "₹399",
    image: "/events_banner.png",
  },
  {
    id: "evt-8",
    title: "Kid's Movie Weekend",
    subtitle: "Family Fun at the Cinema",
    description:
      "A special family screening weekend with animated classics, interactive story time, and themed snack packages for little cinephiles.",
    date: "Sun, Jul 27",
    time: "11:00 AM",
    badge: "FAMILY",
    category: "Family",
    accentColor: "#84cc16",
    badgeGradient: "linear-gradient(135deg,#84cc16,#65a30d)",
    tags: ["Animated", "Family", "Interactive"],
    seats: 280,
    price: "₹199",
    image: "/cinema_grid_bg.png",
  },
];

const CATEGORIES = [
  "All",
  "Premiere",
  "Classics",
  "Special",
  "Marathon",
  "Indie",
  "Bollywood",
  "Family",
];

/* ───────────── Event Card ───────────── */
function EventCard({ event }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={() => navigate("/events")}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        borderRadius: "20px",
        overflow: "hidden",
        border: `1px solid ${hovered ? event.accentColor + "40" : "rgba(39,39,42,0.7)"}`,
        background: "rgba(18,18,20,0.8)",
        cursor: "pointer",
        transition: "all 0.35s ease",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered
          ? `0 16px 40px ${event.accentColor}25`
          : "0 4px 20px rgba(0,0,0,0.3)",
      }}
    >
      {/* Image header */}
      <div
        style={{
          position: "relative",
          height: "160px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${event.image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            transform: hovered ? "scale(1.08)" : "scale(1)",
            transition: "transform 0.6s ease",
            filter: "brightness(0.7) saturate(1.2)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(to bottom, transparent 30%, rgba(9,9,11,0.95) 100%)`,
          }}
        />
        {/* Badge */}
        <span
          style={{
            position: "absolute",
            top: "12px",
            left: "12px",
            background: event.badgeGradient,
            padding: "3px 12px",
            borderRadius: "999px",
            fontSize: "9px",
            fontWeight: "900",
            letterSpacing: "0.15em",
            color: "white",
            textTransform: "uppercase",
          }}
        >
          {event.badge}
        </span>
        {/* Price */}
        <span
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            fontSize: "14px",
            fontWeight: "900",
            color: event.accentColor,
            background: `${event.accentColor}15`,
            border: `1px solid ${event.accentColor}30`,
            padding: "3px 10px",
            borderRadius: "8px",
          }}
        >
          {event.price}
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: "16px 18px 18px" }}>
        <h4
          style={{
            fontSize: "14px",
            fontWeight: "900",
            color: "#f4f4f5",
            marginBottom: "4px",
            letterSpacing: "0.02em",
            lineHeight: 1.3,
          }}
        >
          {event.title}
        </h4>
        <p
          style={{
            fontSize: "10px",
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: event.accentColor,
            marginBottom: "10px",
          }}
        >
          {event.subtitle}
        </p>
        <p
          style={{
            fontSize: "11.5px",
            color: "rgba(161,161,170,0.8)",
            lineHeight: 1.6,
            marginBottom: "12px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {event.description}
        </p>

        {/* Meta row */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "12px",
            fontSize: "10px",
            fontWeight: "700",
            color: "rgba(161,161,170,0.7)",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <svg
              width="11"
              height="11"
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
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke={event.accentColor}
              strokeWidth="2.5"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {event.time}
          </span>
        </div>

        {/* Tags */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "5px",
            marginBottom: "14px",
          }}
        >
          {event.tags.map((tag) => (
            <span
              key={tag}
              style={{
                padding: "2px 8px",
                borderRadius: "999px",
                fontSize: "9px",
                fontWeight: "700",
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                background: `${event.accentColor}12`,
                border: `1px solid ${event.accentColor}25`,
                color: event.accentColor,
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* CTA */}
        <button
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "12px",
            background: hovered
              ? `linear-gradient(135deg, ${event.accentColor}, ${event.accentColor}cc)`
              : `${event.accentColor}15`,
            color: hovered ? "white" : event.accentColor,
            border: `1px solid ${event.accentColor}30`,
            fontSize: "10px",
            fontWeight: "900",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "all 0.3s ease",
            boxShadow: hovered ? `0 6px 20px ${event.accentColor}40` : "none",
          }}
        >
          Book Event →
        </button>
      </div>
    </div>
  );
}

/* ───────────── Page ───────────── */
export default function EventsPage() {
  const [selectedCity, setSelectedCity] = useState(
    localStorage.getItem("city") || "Bangalore",
  );
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const handleCityChange = (city) => {
    setSelectedCity(city);
    localStorage.setItem("city", city);
  };

  const filtered = ALL_EVENTS.filter((evt) => {
    const matchCat =
      activeCategory === "All" || evt.category === activeCategory;
    const matchSearch =
      searchQuery === "" ||
      evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        color: "white",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <CinemaBackground />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        <Header selectedCity={selectedCity} onCityChange={handleCityChange} />

        <main
          style={{
            maxWidth: "1280px",
            width: "100%",
            margin: "0 auto",
            padding: "32px 24px",
            flex: 1,
          }}
        >
          {/* Hero banner */}
          <div
            style={{
              position: "relative",
              borderRadius: "24px",
              overflow: "hidden",
              marginBottom: "40px",
              height: "220px",
              display: "flex",
              alignItems: "center",
              padding: "0 48px",
              border: "1px solid rgba(244,63,94,0.2)",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: "url(/events_banner.png)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                opacity: 0.2,
                filter: "saturate(1.4)",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(135deg, rgba(9,9,11,0.97) 0%, rgba(9,9,11,0.8) 60%, rgba(9,9,11,0.5) 100%)",
              }}
            />
            <div style={{ position: "relative", zIndex: 2 }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "4px 14px",
                  borderRadius: "999px",
                  background: "rgba(244,63,94,0.15)",
                  border: "1px solid rgba(244,63,94,0.3)",
                  color: "#f43f5e",
                  fontSize: "10px",
                  fontWeight: "900",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  marginBottom: "14px",
                }}
              >
                🎭 Special Events
              </span>
              <h2
                style={{
                  fontSize: "clamp(1.6rem, 4vw, 2.8rem)",
                  fontWeight: "900",
                  letterSpacing: "0.02em",
                  lineHeight: 1.1,
                  marginBottom: "10px",
                  background:
                    "linear-gradient(135deg, #fda4af, #f43f5e, #e11d48)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Unforgettable Cinema Events
              </h2>
              <p
                style={{
                  fontSize: "13px",
                  color: "rgba(161,161,170,0.8)",
                  maxWidth: "480px",
                  lineHeight: 1.7,
                }}
              >
                From midnight premieres to marathon screenings — book your spot
                at exclusive cinema experiences in {selectedCity}.
              </p>
            </div>
          </div>

          {/* Search + filters row */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              alignItems: "center",
              marginBottom: "28px",
            }}
          >
            {/* Search */}
            <div
              style={{
                position: "relative",
                flex: "1 1 240px",
                minWidth: "200px",
                maxWidth: "380px",
              }}
            >
              <svg
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#71717a",
                }}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 16px 9px 40px",
                  background: "rgba(24,24,27,0.6)",
                  border: "1px solid rgba(63,63,70,0.7)",
                  borderRadius: "999px",
                  color: "#e4e4e7",
                  fontSize: "12px",
                  outline: "none",
                  transition: "border-color 0.2s ease",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#f43f5e")}
                onBlur={(e) =>
                  (e.target.style.borderColor = "rgba(63,63,70,0.7)")
                }
              />
            </div>

            {/* Category pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "999px",
                    fontSize: "10px",
                    fontWeight: "900",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    border: "1px solid",
                    transition: "all 0.25s ease",
                    background:
                      activeCategory === cat ? "#f43f5e" : "rgba(24,24,27,0.6)",
                    borderColor:
                      activeCategory === cat ? "#f43f5e" : "rgba(63,63,70,0.7)",
                    color: activeCategory === cat ? "white" : "#a1a1aa",
                    boxShadow:
                      activeCategory === cat
                        ? "0 4px 14px rgba(244,63,94,0.35)"
                        : "none",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Count */}
          <div
            style={{
              marginBottom: "20px",
              fontSize: "12px",
              color: "#71717a",
              fontWeight: "700",
            }}
          >
            Showing {filtered.length} event{filtered.length !== 1 ? "s" : ""}
            {activeCategory !== "All" ? ` in "${activeCategory}"` : ""}
          </div>

          {/* Events grid */}
          {filtered.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "80px 20px",
                border: "1px dashed rgba(63,63,70,0.6)",
                borderRadius: "20px",
                color: "#71717a",
                fontSize: "13px",
                fontWeight: "700",
              }}
            >
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>🎬</div>
              No events found. Try a different category or search.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "20px",
              }}
            >
              {filtered.map((evt) => (
                <EventCard key={evt.id} event={evt} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
