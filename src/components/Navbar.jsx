// import { Link, useNavigate } from "react-router-dom";

// const Navbar = () => {
//   const navigate = useNavigate();
//   const token = localStorage.getItem("token");
//   const user = JSON.parse(localStorage.getItem("user") || "{}");

//   const handleLogout = () => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("user");
//     navigate("/login");
//   };

//   const concessionApproved = user?.concessionApproved;
//   const driverApproved = user?.driverApproved;

//   return (
//     <div>
//       {concessionApproved && (
//         <div style={{
//           background: "linear-gradient(90deg, #0d9488, #0f766e)",
//           color: "white",
//           textAlign: "center",
//           padding: "8px 16px",
//           fontSize: "14px",
//           fontWeight: "600",
//         }}>
//           ✓ You are now a Concession User — 25% discount on all rides
//         </div>
//       )}
//       {driverApproved && (
//         <div style={{
//           background: "linear-gradient(90deg, #154272, #1e88e5)",
//           color: "white",
//           textAlign: "center",
//           padding: "8px 16px",
//           fontSize: "14px",
//           fontWeight: "600",
//         }}>
//           ✓ You are an approved driver — You can accept rides
//         </div>
//       )}
//     <div style={styles.nav}>
//       <div style={styles.logo}>🚇 MetroSetu</div>

//       <div style={styles.links}>
//         <Link to="/home">Home</Link>

//         {token && <Link to="/donate">Donate</Link>}

//         {token && <Link to="/recommendation">Recommendation</Link>}

//         {token && <Link to="/virtualhub">Virtual Hub</Link>}

//         {token && user?.isAdmin && <Link to="/admin">Admin Dashboard</Link>}
//         {token && user?.driverApproved && <Link to="/driver-dashboard">Driver Dashboard</Link>}

//         {!token && <Link to="/login">Login</Link>}
//         {!token && <Link to="/signup">Signup</Link>}

//         {token && (
//           <button onClick={handleLogout} style={styles.logout}>
//             Logout
//           </button>
//         )}
//       </div>
//     </div>
//     </div>
//   );
// };

// const styles = {
//   nav: {
//     display: "flex",
//     justifyContent: "space-between",
//     padding: "15px 30px",
//     background: "#154272",
//     color: "white",
//     alignItems: "center"
//   },
//   logo: {
//     fontWeight: "bold",
//     fontSize: "18px"
//   },
//   links: {
//     display: "flex",
//     gap: "20px",
//     alignItems: "center"
//   },
//   logout: {
//     background: "red",
//     border: "none",
//     padding: "8px 12px",
//     color: "white",
//     cursor: "pointer",
//     borderRadius: "4px"
//   }
// };

// export default Navbar;
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("driverActive");
    navigate("/login");
  };

  // Close mobile menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [navigate]);

  const concessionApproved = user?.concessionApproved;
  const concessionCategory = user?.concessionCategory;
  const driverApproved = user?.driverApproved;
  const avatarLetter = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .nb-banner {
          text-align: center;
          padding: 7px 16px;
          font-size: 12px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          letter-spacing: 0.2px;
        }
        .nb-banner.concession {
          background: #ecfdf5;
          color: #059669;
          border-bottom: 1px solid #d1fae5;
        }
        .nb-banner.driver {
          background: #eff6ff;
          color: #2563eb;
          border-bottom: 1px solid #dbeafe;
        }

        .nb {
          background: #fff;
          border-bottom: 1px solid #e5e5e5;
          padding: 0 32px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 200;
          font-family: 'Inter', sans-serif;
        }

        .nb-left {
          display: flex;
          align-items: center;
          gap: 6px;
          list-style: none;
        }
        .nb-left a {
          color: #555;
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          padding: 6px 12px;
          border-radius: 6px;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .nb-left a:hover {
          color: #111;
          background: #f5f5f5;
        }

        .nb-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nb-user {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 12px 4px 4px;
          border: 1px solid #e5e5e5;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          color: #333;
        }
        .nb-avatar {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #111;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
        }

        .nb-logout {
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          background: #fff;
          color: #666;
          border: 1px solid #e5e5e5;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .nb-logout:hover {
          border-color: #ef4444;
          color: #ef4444;
        }

        .nb-auth a {
          color: #555;
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          padding: 6px 14px;
          border-radius: 6px;
          transition: all 0.15s;
        }
        .nb-auth a:hover {
          color: #111;
          background: #f5f5f5;
        }
        .nb-auth a.signup {
          background: #111;
          color: #fff;
          font-weight: 600;
        }
        .nb-auth a.signup:hover {
          background: #333;
        }

        /* Hamburger */
        .nb-hamburger {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          flex-direction: column;
          gap: 4px;
        }
        .nb-hamburger span {
          display: block;
          width: 18px;
          height: 2px;
          background: #333;
          border-radius: 1px;
          transition: all 0.2s;
        }
        .nb-hamburger.open span:nth-child(1) {
          transform: rotate(45deg) translate(3px, 3px);
        }
        .nb-hamburger.open span:nth-child(2) {
          opacity: 0;
        }
        .nb-hamburger.open span:nth-child(3) {
          transform: rotate(-45deg) translate(4px, -4px);
        }

        /* Mobile menu */
        .nb-mobile {
          display: none;
          position: fixed;
          top: 52px;
          left: 0;
          right: 0;
          background: #fff;
          border-bottom: 1px solid #e5e5e5;
          padding: 12px 16px;
          z-index: 199;
          box-shadow: 0 4px 16px rgba(0,0,0,0.06);
          flex-direction: column;
          gap: 4px;
        }
        .nb-mobile.show {
          display: flex;
        }
        .nb-mobile a {
          display: block;
          color: #333;
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          padding: 10px 12px;
          border-radius: 6px;
          transition: all 0.15s;
        }
        .nb-mobile a:hover {
          background: #f5f5f5;
          color: #111;
        }
        .nb-mobile .mob-logout {
          margin-top: 4px;
          padding: 10px 12px;
          font-size: 13px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          background: #fff;
          color: #ef4444;
          border: 1px solid #fecaca;
          border-radius: 6px;
          cursor: pointer;
          text-align: left;
          width: 100%;
        }
        .nb-mobile .mob-logout:hover {
          background: #fef2f2;
        }
        .nb-mobile .mob-divider {
          height: 1px;
          background: #f0f0f0;
          margin: 4px 0;
        }

        @media (max-width: 768px) {
          .nb { padding: 0 16px; }
          .nb-left { display: none; }
          .nb-right .nb-logout { display: none; }
          .nb-auth { display: none !important; }
          .nb-hamburger { display: flex; }
        }
      `}</style>

      {/* Status Banners */}
      {concessionApproved && (
        <div className="nb-banner concession">
          ✓ Concession approved ({concessionCategory}) — 25% discount on rides
        </div>
      )}
      {driverApproved && (
        <div className="nb-banner driver">
          ✓ Approved driver — You can accept rides
        </div>
      )}

      {/* Navbar */}
      <nav className="nb" ref={menuRef}>
        {/* Left links */}
        <ul className="nb-left">
          <li><Link to="/home">Home</Link></li>
          {token && <li><Link to="/recommendation">Recommendation</Link></li>}
          {token && <li><Link to="/virtualhub">Virtual Hub</Link></li>}
          {token && <li><Link to="/donate">Donate</Link></li>}
          {token && user?.isAdmin && (
            <li><Link to="/admin">Admin</Link></li>
          )}
          {token && driverApproved && (
            <li><Link to="/driver-dashboard">Driver</Link></li>
          )}
        </ul>

        {/* Right side */}
        <div className="nb-right">
          {token ? (
            <>
              <div className="nb-user">
                <div className="nb-avatar">{avatarLetter}</div>
                {user.name || "User"}
              </div>
              <button className="nb-logout" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <div className="nb-auth" style={{ display: "flex", gap: 6 }}>
              <Link to="/login">Login</Link>
              <Link to="/signup" className="signup">Sign up</Link>
            </div>
          )}

          {/* Hamburger */}
          <button
            className={`nb-hamburger ${mobileOpen ? "open" : ""}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        {/* Mobile dropdown */}
        <div className={`nb-mobile ${mobileOpen ? "show" : ""}`}>
          <Link to="/home" onClick={() => setMobileOpen(false)}>Home</Link>
          {token && (
            <>
              <Link to="/recommendation" onClick={() => setMobileOpen(false)}>
                Recommendation
              </Link>
              <Link to="/virtualhub" onClick={() => setMobileOpen(false)}>
                Virtual Hub
              </Link>
              <Link to="/donate" onClick={() => setMobileOpen(false)}>
                Donate
              </Link>
              {user?.isAdmin && (
                <Link to="/admin" onClick={() => setMobileOpen(false)}>
                  Admin Dashboard
                </Link>
              )}
              {driverApproved && (
                <Link to="/driver-dashboard" onClick={() => setMobileOpen(false)}>
                  Driver Dashboard
                </Link>
              )}
              <div className="mob-divider" />
              <div style={{ padding: "6px 12px", fontSize: 12, color: "#999" }}>
                Signed in as <strong style={{ color: "#333" }}>{user.name || "User"}</strong>
                {user.email && (
                  <span style={{ display: "block", fontSize: 11, color: "#bbb", marginTop: 2 }}>
                    {user.email}
                  </span>
                )}
              </div>
              <button
                className="mob-logout"
                onClick={() => { setMobileOpen(false); handleLogout(); }}
              >
                Logout
              </button>
            </>
          )}
          {!token && (
            <>
              <Link to="/login" onClick={() => setMobileOpen(false)}>Login</Link>
              <Link to="/signup" onClick={() => setMobileOpen(false)}>Sign up</Link>
            </>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;