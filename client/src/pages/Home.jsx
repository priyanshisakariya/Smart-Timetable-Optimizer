import { Link } from "react-router-dom";
import {
  FaCalendarAlt,
  FaUsers,
  FaChalkboardTeacher,
  FaClock,
} from "react-icons/fa";

import "./Home.css";

function Home() {
  return (
    <div className="home-page">
      {/* ================= NAVBAR ================= */}

      <header className="home-navbar">
        <div className="home-logo">Smart Timetable Optimizer</div>

        <nav className="home-nav">
          <Link to="/">Home</Link>

          <a href="#about">About</a>

          <a href="#features">Features</a>

          <Link to="/login" className="home-login-button">
            Login
          </Link>
        </nav>
      </header>

      {/* ================= HERO ================= */}

      <section className="home-hero">
        <div className="hero-content">
          <span className="hero-badge">Smart Academic Scheduling</span>

          <h1>
            Smart Timetable
            <span> Optimizer</span>
          </h1>

          <p>
            Simplify academic scheduling with a smart platform designed for
            administrators, faculty, and students.
          </p>

          <div className="hero-buttons">
            <Link to="/login" className="primary-button">
              Login
            </Link>

            <Link to="/student/register" className="secondary-button">
              Student Registration
            </Link>
          </div>
        </div>

        <div className="hero-card">
          <div className="hero-card-icon">
            <FaCalendarAlt />
          </div>

          <h3>Manage Your Schedule</h3>

          <p>
            Create and manage academic timetables, faculty schedules, rooms, and
            subjects from one centralized platform.
          </p>
        </div>
      </section>

      {/* ================= ABOUT ================= */}

      <section className="home-section about-section" id="about">
        <div className="section-heading">
          <span>About The System</span>

          <h2>One Platform For Academic Management</h2>

          <p>
            Smart Timetable Optimizer helps educational institutions organize
            academic scheduling efficiently and reduce manual work.
          </p>
        </div>
      </section>

      {/* ================= FEATURES ================= */}

      <section className="home-section features-section" id="features">
        <div className="section-heading">
          <span>Features</span>

          <h2>Everything In One Place</h2>
        </div>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <FaUsers />
            </div>

            <h3>Student Management</h3>

            <p>
              Manage student information and provide students with their
              academic schedules.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <FaChalkboardTeacher />
            </div>

            <h3>Faculty Management</h3>

            <p>
              Manage faculty information, subjects, availability, and teaching
              schedules.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <FaCalendarAlt />
            </div>

            <h3>Timetable Management</h3>

            <p>
              Generate and manage organized academic timetables for different
              classes.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <FaClock />
            </div>

            <h3>Time Management</h3>

            <p>
              Manage time slots and organize academic activities efficiently.
            </p>
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}

      <section className="home-cta">
        <h2>Ready to manage your timetable?</h2>

        <p>Login to access your personalized dashboard.</p>

        <Link to="/login" className="primary-button">
          Get Started
        </Link>
      </section>

      {/* ================= FOOTER ================= */}

      <footer className="home-footer">
        <p>© 2026 Smart Timetable Optimizer. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Home;
