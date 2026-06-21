import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../redux/slices/authSlice";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error("Please fill all fields");
      return;
    }
    try {
      const result = await dispatch(loginUser(formData)).unwrap();
      toast.success("Login successful!");
      navigate(result.user.role === "ADMIN" ? "/admin/dashboard" : "/user/browse");
    } catch (err) {
      toast.error(err || "Login failed");
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        .cf-root {
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          background-color: #0A0A0F;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
        }

        /* Ambient glow blobs */
        .cf-root::before {
          content: '';
          position: fixed;
          top: -20%;
          right: -10%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(230,57,70,0.07) 0%, transparent 70%);
          pointer-events: none;
        }
        .cf-root::after {
          content: '';
          position: fixed;
          bottom: -20%;
          left: -10%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(230,57,70,0.04) 0%, transparent 70%);
          pointer-events: none;
        }

        .cf-card {
          width: 100%;
          max-width: 420px;
          position: relative;
          z-index: 1;
        }

        /* Brand */
        .cf-brand {
          text-align: center;
          margin-bottom: 2.5rem;
        }
        .cf-brand-name {
          font-size: 1.75rem;
          font-weight: 700;
          color: #F9FAFB;
          letter-spacing: -0.03em;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.4rem;
        }
        .cf-brand-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #E63946;
          display: inline-block;
          margin-bottom: 2px;
          box-shadow: 0 0 8px rgba(230,57,70,0.8);
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px rgba(230,57,70,0.8); }
          50% { opacity: 0.6; box-shadow: 0 0 4px rgba(230,57,70,0.4); }
        }
        .cf-brand-sub {
          font-size: 0.8rem;
          color: #4B5563;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 500;
        }

        /* Form panel */
        .cf-panel {
          background: #111118;
          border: 1px solid #1E1E2A;
          border-radius: 16px;
          padding: 2.25rem 2rem;
          box-shadow: 0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset;
        }

        .cf-panel-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #F9FAFB;
          margin-bottom: 0.3rem;
          letter-spacing: -0.02em;
        }
        .cf-panel-subtitle {
          font-size: 0.8rem;
          color: #4B5563;
          margin-bottom: 1.75rem;
        }

        /* Fields */
        .cf-field {
          margin-bottom: 1.1rem;
        }
        .cf-label {
          display: block;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: #6B7280;
          margin-bottom: 0.5rem;
        }
        .cf-input-wrap {
          position: relative;
        }
        .cf-input {
          width: 100%;
          background: #0D0D14;
          color: #F9FAFB;
          border: 1px solid #1E1E2A;
          border-radius: 10px;
          padding: 0.75rem 1rem;
          font-size: 0.9rem;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .cf-input::placeholder { color: #2D2D3A; }
        .cf-input:focus {
          border-color: #E63946;
          box-shadow: 0 0 0 3px rgba(230,57,70,0.1);
        }
        .cf-input-pw { padding-right: 3rem; }

        .cf-eye-btn {
          position: absolute;
          right: 0.85rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          color: #3D3D50;
          transition: color 0.2s;
          display: flex;
          align-items: center;
        }
        .cf-eye-btn:hover { color: #6B7280; }

        /* Error */
        .cf-error {
          background: rgba(230,57,70,0.08);
          border: 1px solid rgba(230,57,70,0.25);
          color: #FCA5A5;
          padding: 0.7rem 0.9rem;
          border-radius: 8px;
          font-size: 0.8rem;
          margin-bottom: 1rem;
        }

        /* Submit */
        .cf-submit {
          width: 100%;
          padding: 0.8rem;
          border-radius: 10px;
          border: none;
          font-family: 'Inter', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 0.5rem;
          letter-spacing: 0.01em;
        }
        .cf-submit-active {
          background: #E63946;
          color: #fff;
          box-shadow: 0 4px 20px rgba(230,57,70,0.35);
        }
        .cf-submit-active:hover {
          background: #C8313D;
          box-shadow: 0 4px 28px rgba(230,57,70,0.5);
          transform: translateY(-1px);
        }
        .cf-submit-active:active { transform: translateY(0); }
        .cf-submit-disabled {
          background: #1A1A24;
          color: #3D3D50;
          cursor: not-allowed;
        }

        /* Divider */
        .cf-divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 1.5rem 0;
        }
        .cf-divider-line {
          flex: 1;
          height: 1px;
          background: #1A1A24;
        }
        .cf-divider-text {
          font-size: 0.7rem;
          color: #2D2D3A;
          letter-spacing: 0.1em;
          font-weight: 500;
        }

        /* Demo buttons */
        .cf-demo-btns {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          margin-bottom: 1.5rem;
        }
        .cf-demo-btn {
          width: 100%;
          background: transparent;
          border: 1px solid #1A1A24;
          color: #4B5563;
          padding: 0.65rem 1rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          letter-spacing: 0.01em;
        }
        .cf-demo-btn:hover {
          border-color: #2D2D3A;
          color: #9CA3AF;
          background: #111118;
        }

        /* Footer */
        .cf-footer {
          text-align: center;
          font-size: 0.8rem;
          color: #3D3D50;
        }
        .cf-footer a {
          color: #E63946;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s;
        }
        .cf-footer a:hover { color: #FF5A65; }

        /* Bottom pills */
        .cf-pills {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 1.75rem;
        }
        .cf-pill {
          font-size: 0.7rem;
          color: #2D2D3A;
          letter-spacing: 0.06em;
          padding: 0.3rem 0.7rem;
          border: 1px solid #1A1A24;
          border-radius: 99px;
          font-weight: 500;
        }
      `}</style>

      <div className="cf-root">
        <div className="cf-card">

          {/* Brand */}
          <div className="cf-brand">
            <div className="cf-brand-name">
              <span className="cf-brand-dot" />
              CineFlow
            </div>
            <div className="cf-brand-sub">Movie Booking Platform</div>
          </div>

          {/* Panel */}
          <div className="cf-panel">
            <div className="cf-panel-title">Sign in</div>
            <div className="cf-panel-subtitle">Welcome back — enter your credentials to continue</div>

            <form onSubmit={handleSubmit}>
              <div className="cf-field">
                <label className="cf-label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="cf-input"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <div className="cf-field">
                <label className="cf-label">Password</label>
                <div className="cf-input-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="cf-input cf-input-pw"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="cf-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && <div className="cf-error">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className={`cf-submit ${loading ? "cf-submit-disabled" : "cf-submit-active"}`}
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <div className="cf-divider">
              <div className="cf-divider-line" />
              <span className="cf-divider-text">OR</span>
              <div className="cf-divider-line" />
            </div>

            <div className="cf-demo-btns">
              <button
                type="button"
                className="cf-demo-btn"
                onClick={() => setFormData({ email: "admin@cineflow.com", password: "NewPass@12345" })}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                Demo Admin
              </button>
              <button
                type="button"
                className="cf-demo-btn"
                onClick={() => setFormData({ email: "user@cineflow.com", password: "NewPass@12345" })}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                Demo User
              </button>
            </div>

            <div className="cf-footer">
              No account?{" "}
              <Link to="/signup">Create one</Link>
            </div>
          </div>

          <div className="cf-pills">
            <span className="cf-pill">Movies</span>
            <span className="cf-pill">Bookings</span>
            <span className="cf-pill">Payments</span>
          </div>
        </div>
      </div>
    </>
  );
}