import "./Navbar.css";
import { useNavigate } from "react-router-dom";

function Navbar({ onMenuClick, role = "admin" }) {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");

        navigate("/login");
    };

    return (
        <header className="navbar">

            <div className="navbar-left">

                <button
                    className="menu-button"
                    onClick={onMenuClick}
                >
                    ☰
                </button>

                <h2>Smart Timetable Optimizer</h2>

            </div>

            <div className="navbar-user">

                <span>
                    {role === "faculty"
                        ? "Faculty"
                        : role === "student"
                            ? "Student"
                            : "Admin"}
                </span>

                <button
                    className="logout-button"
                    onClick={handleLogout}
                >
                    Logout
                </button>

            </div>

        </header>
    );
}

export default Navbar;