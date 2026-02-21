import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const concessionApproved = user?.concessionApproved;
  const driverApproved = user?.driverApproved;

  return (
    <div>
      {concessionApproved && (
        <div style={{
          background: "linear-gradient(90deg, #0d9488, #0f766e)",
          color: "white",
          textAlign: "center",
          padding: "8px 16px",
          fontSize: "14px",
          fontWeight: "600",
        }}>
          ✓ You are now a Concession User — 25% discount on all rides
        </div>
      )}
      {driverApproved && (
        <div style={{
          background: "linear-gradient(90deg, #154272, #1e88e5)",
          color: "white",
          textAlign: "center",
          padding: "8px 16px",
          fontSize: "14px",
          fontWeight: "600",
        }}>
          ✓ You are an approved driver — You can accept rides
        </div>
      )}
    <div style={styles.nav}>
      <div style={styles.logo}>🚇 MetroSetu</div>

      <div style={styles.links}>
        <Link to="/home">Home</Link>

        {token && <Link to="/donate">Donate</Link>}

        {token && <Link to="/recommendation">Recommendation</Link>}

        {token && <Link to="/virtualhub">Virtual Hub</Link>}

        {token && user?.isAdmin && <Link to="/admin">Admin Dashboard</Link>}

        {!token && <Link to="/login">Login</Link>}
        {!token && <Link to="/signup">Signup</Link>}

        {token && (
          <button onClick={handleLogout} style={styles.logout}>
            Logout
          </button>
        )}
      </div>
    </div>
    </div>
  );
};

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: "15px 30px",
    background: "#154272",
    color: "white",
    alignItems: "center"
  },
  logo: {
    fontWeight: "bold",
    fontSize: "18px"
  },
  links: {
    display: "flex",
    gap: "20px",
    alignItems: "center"
  },
  logout: {
    background: "red",
    border: "none",
    padding: "8px 12px",
    color: "white",
    cursor: "pointer",
    borderRadius: "4px"
  }
};

export default Navbar;
