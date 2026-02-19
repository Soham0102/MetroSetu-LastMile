import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div style={styles.nav}>
      <div style={styles.logo}>🚇 MetroSetu</div>

      <div style={styles.links}>
        <Link to="/">Home</Link>

        {token && <Link to="/recommendation">Recommendation</Link>}

        {token && <Link to="/virtualhub">Virtual Hub</Link>}

        {!token && <Link to="/login">Login</Link>}
        {!token && <Link to="/signup">Signup</Link>}

        {token && (
          <button onClick={handleLogout} style={styles.logout}>
            Logout
          </button>
        )}
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
