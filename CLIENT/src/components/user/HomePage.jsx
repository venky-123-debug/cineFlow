import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate }              from "react-router-dom";
import { fetchMovies }              from "../../redux/slices/movieSlice";

const GENRES = ["All","Action","Comedy","Drama","Horror","Romance","Thriller","Sci-Fi","Animation","Adventure"];
const LANGS  = ["All","Hindi","English","Tamil","Telugu","Malayalam","Kannada"];

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function MovieCard({ movie, onClick }) {
  const bannerSrc = movie.banner
    ? (movie.banner.startsWith("http") ? movie.banner : `${API}/${movie.banner}`)
    : null;

  return (
    <div className="movie-card card" onClick={onClick} role="button">
      {bannerSrc
        ? <img src={bannerSrc} alt={movie.title} className="movie-poster" loading="lazy" />
        : <div className="movie-poster-placeholder">🎬</div>
      }
      <div className="movie-card-body">
        <div className="movie-card-title">{movie.title}</div>
        <div className="movie-card-meta">
          {movie.rating > 0 && (
            <span className="movie-rating">⭐ {movie.rating?.toFixed(1)}</span>
          )}
          <span className="movie-badge badge-ua">{movie.censorRating || "U/A"}</span>
          {movie.genre && <span className="movie-genre">{Array.isArray(movie.genre) ? movie.genre[0] : movie.genre}</span>}
          {movie.language && <span className="movie-lang">{movie.language}</span>}
        </div>
        <button className="movie-book-btn">Book Tickets</button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const { movies, loading, pagination } = useSelector((s) => s.movies);
  const selCity    = useSelector((s) => s.theatres.selectedCity);

  const [genre,    setGenre]   = useState("All");
  const [lang,     setLang]    = useState("All");
  const [page,     setPage]    = useState(1);
  const [heroIdx,  setHeroIdx] = useState(0);

  const load = useCallback(() => {
    dispatch(fetchMovies({
      page,
      ...(genre !== "All" && { genre }),
      ...(lang   !== "All" && { language: lang }),
      ...(selCity && { city: selCity }),
    }));
  }, [dispatch, page, genre, lang, selCity]);

  useEffect(() => { load(); }, [load]);

  // Auto-rotate hero
  useEffect(() => {
    if (movies.length < 2) return;
    const t = setInterval(() => setHeroIdx(i => (i + 1) % Math.min(movies.length, 5)), 4500);
    return () => clearInterval(t);
  }, [movies.length]);

  const featured = movies.slice(0, 5);
  const hero     = featured[heroIdx];
  const API_URL  = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const heroBanner = hero?.banner
    ? (hero.banner.startsWith("http") ? hero.banner : `${API_URL}/${hero.banner}`)
    : null;

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* ── Hero Carousel ── */}
      {hero && (
        <div className="hero">
          {heroBanner && (
            <div className="hero-slide" style={{ opacity: 1 }}>
              <img src={heroBanner} alt={hero.title} className="hero-bg" />
              <div className="hero-overlay" />
            </div>
          )}
          {!heroBanner && (
            <div className="hero-slide" style={{
              background: "linear-gradient(135deg,#0F0F23,#2A0A2E)",
              display: "flex", alignItems: "center", justifyContent: "center", opacity: 1
            }}>
              <span style={{ fontSize: 96, opacity: 0.08 }}>🎬</span>
            </div>
          )}

          <div className="hero-content">
            {hero.genre && (
              <div className="hero-genre">{Array.isArray(hero.genre) ? hero.genre.join(" • ") : hero.genre}</div>
            )}
            <h1 className="hero-title">{hero.title}</h1>
            <div className="hero-meta">
              {hero.rating > 0 && <span>⭐ {hero.rating?.toFixed(1)}/10</span>}
              {hero.duration && <span>🕐 {hero.duration} min</span>}
              {hero.language && <span>🌐 {hero.language}</span>}
              <span className="movie-badge badge-ua">{hero.censorRating || "U/A"}</span>
            </div>
            {hero.description && <p className="hero-desc">{hero.description}</p>}
            <div className="hero-actions">
              <button className="btn btn-primary btn-lg" onClick={() => navigate(`/movie/${hero.id}`)}>
                🎟️ Book Tickets
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => navigate(`/movie/${hero.id}`)}>
                ℹ️ More Info
              </button>
            </div>
          </div>

          <div className="hero-dots">
            {featured.map((_, i) => (
              <div key={i} className={`hero-dot${i === heroIdx ? " active" : ""}`} onClick={() => setHeroIdx(i)} />
            ))}
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "14px 0" }}>
        <div className="page-container">
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 12, color: "var(--dim)", marginRight: 8, fontWeight: 500 }}>GENRE</span>
              <div style={{ display: "inline-flex", gap: 6, flexWrap: "wrap" }}>
                {GENRES.map(g => (
                  <button key={g} className={`pill${genre === g ? " active" : ""}`} onClick={() => { setGenre(g); setPage(1); }}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: 24 }}>
              <span style={{ fontSize: 12, color: "var(--dim)", marginRight: 8, fontWeight: 500 }}>LANGUAGE</span>
              <div style={{ display: "inline-flex", gap: 6, flexWrap: "wrap" }}>
                {LANGS.map(l => (
                  <button key={l} className={`pill${lang === l ? " active" : ""}`} onClick={() => { setLang(l); setPage(1); }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Movie Grid ── */}
      <div className="page-container page-section">
        <div className="flex justify-between items-center mb-24">
          <h2 className="page-title" style={{ margin: 0 }}>
            Now Showing {selCity && <span style={{ color: "var(--red)", fontWeight: 400, fontSize: 16 }}>in {selCity}</span>}
          </h2>
          <span style={{ color: "var(--dim)", fontSize: 13 }}>
            {pagination?.total || movies.length} movies
          </span>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : movies.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎬</div>
            <div className="empty-title">No movies found</div>
            <div className="empty-desc">Try changing the city, genre, or language filter.</div>
            <button className="btn btn-primary mt-16" onClick={() => { setGenre("All"); setLang("All"); }}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid-6">
            {movies.map(m => (
              <MovieCard key={m.id} movie={m} onClick={() => navigate(`/movie/${m.id}`)} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination?.pages > 1 && (
          <div className="pagination">
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`page-btn${p === page ? " active" : ""}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="page-btn" disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)}>›</button>
          </div>
        )}
      </div>
    </div>
  );
}
