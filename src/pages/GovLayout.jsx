// GovLayout.jsx — Shared Government Portal Header, Nav, Footer & Styles
import { useNavigate, useLocation } from "react-router-dom";

export const GOV_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&family=Noto+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap');

  :root {
    --navy: #154272;
    --navy-dark: #0d2d50;
    --navy-light: #1e5799;
    --amber: #f9a825;
    --amber-light: #ffd54f;
    --red-gov: #c62828;
    --green-gov: #2e7d32;
    --bg-page: #eef2f7;
    --bg-card: #ffffff;
    --border: #c5d3e0;
    --text-primary: #1a1a1a;
    --text-secondary: #4a5568;
    --text-muted: #718096;
  }

  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Noto Sans', 'Noto Sans Devanagari', sans-serif;
    background: var(--bg-page);
    color: var(--text-primary);
    font-size: 14px;
    line-height: 1.6;
  }

  /* ── TOP RIBBON ── */
  .g-ribbon {
    background: #0d2d50;
    display: flex; justify-content: space-between; align-items: center;
    padding: 5px 20px; gap: 12px; font-size: 11.5px; color: rgba(255,255,255,0.8);
  }
  .g-ribbon-left { display: flex; align-items: center; gap: 14px; }
  .g-ribbon-right { display: flex; align-items: center; gap: 10px; }
  .g-ribbon a { color: rgba(255,255,255,0.75); text-decoration: none; font-size: 11px; transition: color .15s; }
  .g-ribbon a:hover { color: #fff; }
  .g-skip {
    background: var(--amber); color: var(--navy-dark) !important;
    padding: 2px 8px; border-radius: 2px; font-weight: 700; font-size: 11px !important;
  }
  .g-ribbon-divider { width: 1px; height: 14px; background: rgba(255,255,255,0.2); }
  .g-font-size { display: flex; gap: 2px; }
  .g-font-size button {
    background: none; border: 1px solid rgba(255,255,255,0.25);
    color: rgba(255,255,255,0.8); cursor: pointer; padding: 1px 5px;
    font-size: 10px; border-radius: 2px; transition: all .15s;
  }
  .g-font-size button:hover { background: rgba(255,255,255,0.1); color: #fff; }

  /* ── EMBLEM HEADER ── */
  .g-header {
    background: linear-gradient(180deg, #fff 0%, #f4f8fd 100%);
    border-bottom: 4px solid var(--amber);
    padding: 14px 20px;
    display: flex; align-items: center; gap: 16px;
  }
  .g-emblem {
    width: 74px; height: 74px; flex-shrink: 0;
    background: radial-gradient(circle at 35% 30%, #1976d2, var(--navy-dark));
    border-radius: 50%; border: 3px solid var(--navy);
    display: flex; align-items: center; justify-content: center;
    font-size: 34px;
    box-shadow: 0 3px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1);
  }
  .g-title-block {}
  .g-title-block .g-org { font-size: 11px; color: var(--text-muted); font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 3px; }
  .g-title-block h1 {
    font-family: 'Baloo 2', sans-serif;
    font-size: 26px; font-weight: 800; color: var(--navy);
    letter-spacing: -0.3px; line-height: 1.1;
  }
  .g-title-block h2 { font-size: 13px; font-weight: 500; color: #444; margin-top: 2px; }
  .g-title-block .g-ministry { font-size: 11px; color: var(--text-muted); margin-top: 3px; }
  .g-header-right { margin-left: auto; display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
  .g-badge {
    background: var(--navy); color: var(--amber);
    font-size: 10px; font-weight: 700; letter-spacing: 0.8px;
    padding: 4px 10px; border-radius: 2px; text-transform: uppercase;
  }
  .g-helpline { font-size: 11px; color: var(--text-muted); text-align: right; }
  .g-helpline strong { color: var(--navy); font-size: 13px; display: block; }

  /* ── NAV ── */
  .g-nav {
    background: var(--navy);
    display: flex; overflow-x: auto; position: relative;
  }
  .g-nav::after {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0;
    height: 2px; background: linear-gradient(90deg, var(--amber), transparent);
  }
  .g-nav a {
    color: rgba(255,255,255,0.88); text-decoration: none;
    padding: 11px 16px; font-size: 12.5px; font-weight: 500; white-space: nowrap;
    border-right: 1px solid rgba(255,255,255,0.08);
    transition: background .15s, color .15s; position: relative; display: block;
  }
  .g-nav a:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .g-nav a.active {
    background: var(--amber); color: var(--navy-dark);
    font-weight: 700;
  }

  /* ── BREADCRUMB ── */
  .g-breadcrumb {
    background: #dde6f0; border-bottom: 1px solid #bfcfdf;
    padding: 7px 20px; font-size: 12px; color: var(--text-muted);
    display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
  }
  .g-breadcrumb a { color: var(--navy); text-decoration: none; }
  .g-breadcrumb a:hover { text-decoration: underline; }
  .g-breadcrumb .sep { color: #94a3b8; }

  /* ── NOTICE BAR ── */
  .g-notice {
    background: #fff8e1; border-bottom: 1px solid #ffe082;
    border-top: 3px solid var(--amber);
    padding: 8px 20px; display: flex; align-items: center; gap: 10px;
    font-size: 12.5px; color: #5a3e00; overflow: hidden;
  }
  .g-notice-tag {
    background: var(--amber); color: #1a1a1a; flex-shrink: 0;
    font-size: 10px; font-weight: 700; padding: 3px 8px;
    border-radius: 2px; text-transform: uppercase; letter-spacing: 0.5px;
  }

  /* ── HERO ── */
  .g-hero {
    background: linear-gradient(135deg, var(--navy-dark) 0%, var(--navy) 45%, #1565c0 100%);
    padding: 28px 20px 24px; position: relative; overflow: hidden;
  }
  .g-hero::before {
    content: '';
    position: absolute; inset: 0;
    background: url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.025'%3E%3Cpath d='M0 0h40v40H0zM40 40h40v40H40z'/%3E%3C/g%3E%3C/svg%3E");
  }
  .g-hero-inner { position: relative; max-width: 800px; }
  .g-hero-pill {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(249,168,37,0.15); border: 1px solid rgba(249,168,37,0.4);
    color: var(--amber-light); font-size: 10.5px; font-weight: 700;
    padding: 4px 12px; border-radius: 20px; letter-spacing: 0.8px;
    text-transform: uppercase; margin-bottom: 12px;
  }
  .g-hero h2 {
    font-family: 'Baloo 2', sans-serif;
    font-size: 26px; font-weight: 700; color: #fff; line-height: 1.25; margin-bottom: 8px;
  }
  .g-hero p { font-size: 13.5px; color: rgba(255,255,255,0.8); line-height: 1.65; max-width: 580px; }

  /* ── FOOTER ── */
  .g-footer { background: #111827; color: rgba(255,255,255,0.65); font-size: 12px; margin-top: auto; }
  .g-footer-inner {
    max-width: 1160px; margin: 0 auto; padding: 24px 20px;
    display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 24px;
  }
  .g-footer-brand strong { color: #fff; font-size: 14px; display: block; margin-bottom: 8px; }
  .g-footer-brand p { line-height: 1.65; }
  .g-footer-col h4 { color: var(--amber); font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 10px; }
  .g-footer-col a { display: block; color: rgba(255,255,255,0.6); text-decoration: none; margin-bottom: 6px; font-size: 12px; transition: color .15s; }
  .g-footer-col a:hover { color: #fff; }
  .g-footer-bottom {
    background: #0a0e17; text-align: center;
    padding: 10px 20px; font-size: 11px; color: rgba(255,255,255,0.35);
    border-top: 1px solid rgba(255,255,255,0.06);
  }

  /* ── SHARED FORM STYLES ── */
  .g-form-page {
    min-height: 100vh; display: flex; flex-direction: column;
  }
  .g-content-wrap {
    flex: 1; max-width: 1160px; margin: 0 auto; width: 100%;
    padding: 24px 20px; display: grid;
    grid-template-columns: 1fr 300px; gap: 24px; align-items: start;
  }
  .g-content-wrap.centered {
    grid-template-columns: 560px; justify-content: center;
    padding-top: 36px;
  }

  .g-panel {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-top: 4px solid var(--navy);
  }
  .g-panel-header {
    padding: 16px 20px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 12px;
    background: linear-gradient(180deg, #fafcff 0%, #f5f8fd 100%);
  }
  .g-panel-icon {
    width: 40px; height: 40px; flex-shrink: 0;
    background: var(--navy); border-radius: 4px;
    display: flex; align-items: center; justify-content: center; font-size: 20px;
  }
  .g-panel-header h3 { font-size: 15px; font-weight: 700; color: var(--navy); }
  .g-panel-header p { font-size: 11.5px; color: var(--text-muted); margin-top: 2px; }
  .g-panel-body { padding: 22px; }

  /* Fields */
  .g-field { margin-bottom: 20px; }
  .g-field:last-of-type { margin-bottom: 0; }
  .g-label {
    display: block; font-size: 13px; font-weight: 600; color: var(--text-primary);
    margin-bottom: 5px;
  }
  .g-req { color: var(--red-gov); margin-left: 2px; }
  .g-hint { font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 6px; }
  .g-input-wrap { position: relative; }
  .g-input-icon {
    position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
    font-size: 16px; pointer-events: none; z-index: 1;
  }
  .g-input {
    width: 100%; padding: 10px 12px;
    border: 1.5px solid #a0b4c8; border-radius: 2px;
    font-family: 'Noto Sans', sans-serif; font-size: 13.5px; color: var(--text-primary);
    background: #fafbfc; outline: none; transition: border-color .15s, box-shadow .15s;
  }
  .g-input.with-icon { padding-left: 36px; }
  .g-input.readonly { background: #eef2f7; color: var(--text-secondary); cursor: not-allowed; }
  .g-input:focus {
    border-color: var(--navy); box-shadow: 0 0 0 3px rgba(21,66,114,0.1);
    background: #fff;
  }
  .g-input::placeholder { color: #aab; }
  .g-input-suffix {
    position: absolute; right: 0; top: 0; bottom: 0;
    padding: 0 12px; display: flex; align-items: center;
    background: #e8edf3; border-left: 1.5px solid #a0b4c8;
    font-size: 12px; font-weight: 600; color: var(--text-secondary);
    border-radius: 0 2px 2px 0;
  }
  .g-input.with-suffix { padding-right: 52px; }

  .g-divider { border: none; border-top: 1px solid var(--border); margin: 20px 0; }

  /* Buttons */
  .g-btn-primary {
    width: 100%; background: var(--navy); color: #fff;
    border: none; cursor: pointer; padding: 12px 20px;
    font-family: 'Noto Sans', sans-serif; font-size: 14px; font-weight: 700;
    letter-spacing: 0.4px; border-radius: 2px;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: background .15s; position: relative; overflow: hidden;
  }
  .g-btn-primary:hover { background: var(--navy-dark); }
  .g-btn-primary:active { transform: scale(0.99); }
  .g-btn-secondary {
    width: 100%; background: transparent; color: var(--navy);
    border: 2px solid var(--navy); cursor: pointer; padding: 10px 20px;
    font-family: 'Noto Sans', sans-serif; font-size: 14px; font-weight: 600;
    border-radius: 2px; transition: all .15s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .g-btn-secondary:hover { background: var(--navy); color: #fff; }

  /* Station info */
  .g-station-info {
    background: linear-gradient(135deg, #e8f5e9, #f1f8e9);
    border: 1.5px solid #a5d6a7; border-radius: 2px;
    padding: 14px 16px; margin-bottom: 18px;
    display: flex; align-items: flex-start; gap: 12px;
  }
  .g-station-icon { font-size: 28px; flex-shrink: 0; }
  .g-station-name { font-weight: 700; color: #1b5e20; font-size: 14px; }
  .g-station-dist { font-size: 12px; color: #388e3c; margin-top: 3px; }
  .g-station-line { font-size: 11px; color: #4caf50; margin-top: 2px; }

  /* Sidebar cards */
  .g-sidebar { display: flex; flex-direction: column; gap: 16px; }
  .g-sidebar-card { background: var(--bg-card); border: 1px solid var(--border); }
  .g-sidebar-head {
    background: var(--navy); color: #fff;
    padding: 10px 14px; font-size: 12.5px; font-weight: 700;
    display: flex; align-items: center; gap: 8px; letter-spacing: 0.3px;
  }
  .g-sidebar-body { padding: 14px; }

  .g-mode-list { display: flex; flex-direction: column; gap: 8px; }
  .g-mode-item {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 10px; background: #f5f8fc; border: 1px solid #dde5ef; border-radius: 2px;
  }
  .g-mode-emoji { font-size: 22px; flex-shrink: 0; }
  .g-mode-info strong { font-size: 12.5px; color: var(--navy); display: block; }
  .g-mode-info span { font-size: 11px; color: var(--text-muted); }

  .g-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .g-stat-box {
    background: #f5f8fc; border: 1px solid #dde5ef;
    padding: 10px 8px; text-align: center; border-radius: 2px;
  }
  .g-stat-box strong { display: block; font-family: 'Baloo 2', sans-serif; font-size: 20px; color: var(--navy); line-height: 1; }
  .g-stat-box span { font-size: 10px; color: var(--text-muted); margin-top: 4px; display: block; }

  .g-contact-list { display: flex; flex-direction: column; gap: 8px; }
  .g-contact-item { font-size: 12px; color: #444; display: flex; gap: 8px; align-items: flex-start; }
  .g-contact-item strong { color: var(--navy); flex-shrink: 0; min-width: 70px; }

  /* Auth specific */
  .g-auth-tabs { display: grid; grid-template-columns: 1fr 1fr; }
  .g-auth-tab {
    padding: 12px; text-align: center; cursor: pointer;
    font-size: 13px; font-weight: 600; border: none;
    border-bottom: 3px solid transparent; background: #f0f4f9;
    color: var(--text-muted); transition: all .15s; font-family: inherit;
  }
  .g-auth-tab.active {
    background: #fff; color: var(--navy); border-bottom-color: var(--navy);
  }
  .g-auth-tab:hover:not(.active) { background: #e8edf3; }

  .g-or-divider {
    display: flex; align-items: center; gap: 12px;
    margin: 16px 0; font-size: 12px; color: var(--text-muted);
  }
  .g-or-divider::before, .g-or-divider::after {
    content: ''; flex: 1; height: 1px; background: var(--border);
  }

  .g-link { color: var(--navy); text-decoration: none; font-weight: 600; }
  .g-link:hover { text-decoration: underline; }

  .g-disclaimer {
    margin-top: 14px; font-size: 11px; color: var(--text-muted); text-align: center; line-height: 1.6;
  }

  .g-quick-picks { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
  .g-quick-btn {
    background: #e8edf3; border: 1px solid #b0bec5;
    color: var(--navy); font-size: 11.5px; font-weight: 600;
    padding: 3px 10px; border-radius: 2px; cursor: pointer;
    transition: all .12s; font-family: inherit;
  }
  .g-quick-btn:hover { background: var(--navy); color: #fff; border-color: var(--navy); }

  .g-map-placeholder {
    width: 100%; border-radius: 2px; border: 1.5px solid var(--border);
    overflow: hidden; background: #e8edf3;
    display: flex; align-items: center; justify-content: center;
    min-height: 380px; font-size: 13px; color: var(--text-muted);
  }

  /* Loading */
  .g-loading {
    min-height: 100vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 16px;
    background: var(--bg-page);
  }
  .g-spinner {
    width: 44px; height: 44px;
    border: 4px solid #dde5ef; border-top-color: var(--navy);
    border-radius: 50%; animation: spin .8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .g-password-toggle {
    position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; font-size: 16px; color: var(--text-muted);
    padding: 2px; z-index: 1;
  }

  .g-captcha-box {
    background: #f0f4f9; border: 1.5px solid var(--border); border-radius: 2px;
    padding: 12px 14px; display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 20px;
  }
  .g-captcha-check { display: flex; align-items: center; gap: 10px; cursor: pointer; }
  .g-captcha-check input { width: 18px; height: 18px; cursor: pointer; accent-color: var(--navy); }
  .g-captcha-check span { font-size: 13px; }
  .g-captcha-brand { font-size: 10px; color: var(--text-muted); text-align: right; }
  .g-captcha-brand strong { display: block; }

  .g-strength { height: 3px; border-radius: 2px; margin-top: 6px; transition: all .3s; }
  .g-strength-weak { background: var(--red-gov); width: 33%; }
  .g-strength-med { background: var(--amber); width: 66%; }
  .g-strength-strong { background: var(--green-gov); width: 100%; }

  @media (max-width: 780px) {
    .g-content-wrap { grid-template-columns: 1fr; }
    .g-content-wrap.centered { grid-template-columns: 1fr; }
    .g-footer-inner { grid-template-columns: 1fr 1fr; }
    .g-hero h2 { font-size: 20px; }
    .g-header { flex-wrap: wrap; }
    .g-header-right { margin-left: 0; }
    .g-title-block h1 { font-size: 20px; }
  }
  @media (max-width: 480px) {
    .g-footer-inner { grid-template-columns: 1fr; }
    .g-ribbon-left span { display: none; }
  }
`;

const NAV_ITEMS = ["Home", "About", "Metro Network", "Connectivity Modes", "Citizen Services", "Downloads", "Contact Us"];

export const GovHeader = ({ activeNav = "Home" }) => {
  const navigate = useNavigate();
  return (
    <>
      {/* RIBBON */}
      <div className="g-ribbon">
        <div className="g-ribbon-left">
          <a href="#main" className="g-skip">Skip to Main</a>
          <div className="g-ribbon-divider" />
          <span>भारत सरकार | Government of India</span>
        </div>
        <div className="g-ribbon-right">
          <a href="#">Screen Reader</a>
          <div className="g-ribbon-divider" />
          <a href="#">हिंदी</a>
          <div className="g-ribbon-divider" />
          <div className="g-font-size">
            <button>A-</button><button>A</button><button>A+</button>
          </div>
          <div className="g-ribbon-divider" />
          <a href="#" onClick={(e) => { e.preventDefault(); navigate("/login"); }}>🔐 Login</a>
        </div>
      </div>

      {/* HEADER */}
      <header className="g-header">
        <div className="g-emblem">🚇</div>
        <div className="g-title-block">
          <p className="g-org">Government of India — Smart Cities Mission</p>
          <h1>MetroSetu</h1>
          <h2>Smart Last Mile Connectivity Intelligence System</h2>
          <p className="g-ministry">Ministry of Housing &amp; Urban Affairs</p>
        </div>
        <div className="g-header-right">
          <span className="g-badge">🏅 Digital India Initiative</span>
          <div className="g-helpline">
            <strong>1800-111-550</strong>
            Metro Helpline (Toll-Free)<br />
            Mon–Sat | 6:00 AM – 11:00 PM
          </div>
        </div>
      </header>

      {/* NAV */}
      <nav className="g-nav">
        {NAV_ITEMS.map(item => (
          <a key={item} href="#" className={item === activeNav ? "active" : ""}>{item}</a>
        ))}
      </nav>
    </>
  );
};

export const GovBreadcrumb = ({ crumbs }) => (
  <div className="g-breadcrumb">
    <a href="#">Home</a>
    {crumbs.map((c, i) => (
      <span key={i}><span className="sep">›</span> {c}</span>
    ))}
  </div>
);

export const GovNotice = ({ text }) => (
  <div className="g-notice">
    <span className="g-notice-tag">📢 Notice</span>
    <span>{text}</span>
  </div>
);

export const GovFooter = () => (
  <footer className="g-footer">
    <div className="g-footer-inner">
      <div className="g-footer-brand">
        <strong>MetroSetu — Smart Last Mile Intelligence System</strong>
        <p>An initiative under the Smart Cities Mission, Ministry of Housing &amp; Urban Affairs, Government of India. Designed to improve urban mobility and last-mile connectivity for all citizens.</p>
      </div>
      <div className="g-footer-col">
        <h4>Quick Links</h4>
        <a href="#">About MetroSetu</a>
        <a href="#">Metro Network Map</a>
        <a href="#">Citizen Charter</a>
        <a href="#">Right to Information</a>
        <a href="#">Grievance Portal</a>
      </div>
      <div className="g-footer-col">
        <h4>Policies</h4>
        <a href="#">Terms of Use</a>
        <a href="#">Privacy Policy</a>
        <a href="#">Accessibility</a>
        <a href="#">Copyright Policy</a>
        <a href="#">Hyperlinking Policy</a>
      </div>
      <div className="g-footer-col">
        <h4>Connect</h4>
        <a href="#">Twitter / X</a>
        <a href="#">Facebook</a>
        <a href="#">YouTube</a>
        <a href="#">Developer API</a>
        <a href="#">Open Data Portal</a>
      </div>
    </div>
    <div className="g-footer-bottom">
      © 2024–25 MetroSetu | Ministry of Housing &amp; Urban Affairs, Government of India &nbsp;|&nbsp;
      Last Updated: 19 Feb 2025 &nbsp;|&nbsp; Visitors: 5,24,318 &nbsp;|&nbsp;
      <a href="#" style={{color:'rgba(255,255,255,0.45)', textDecoration:'none'}}>Website Policies</a>
    </div>
  </footer>
);