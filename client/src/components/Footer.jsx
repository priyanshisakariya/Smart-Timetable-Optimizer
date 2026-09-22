
import "./Footer.css";

function Footer() {
    return (
        <footer className="footer">

            <div className="footer-container">

                {/* About */}
                <div className="footer-section">
                    <h2>Smart Timetable Optimizer</h2>
                    <p>
                        A smart academic timetable management system designed
                        to simplify timetable generation and management.
                    </p>
                    <p>
                        Manage students, faculty, subjects, rooms and time
                        slots efficiently from one platform.
                    </p>
                </div>

                {/* Quick Links */}
                <div className="footer-section">
                    <h3>Quick Links</h3>
                    <ul>
                        <li>Home</li>
                        <li>About</li>
                        <li>Features</li>
                        <li>Contact</li>
                    </ul>
                </div>

                {/* Modules */}
                <div className="footer-section">
                    <h3>Modules</h3>
                    <ul>
                        <li>Student Management</li>
                        <li>Faculty Management</li>
                        <li>Subject Management</li>
                        <li>Timetable Generation</li>
                        <li>Room Management</li>
                    </ul>
                </div>

                {/* Contact */}
                <div className="footer-section">
                    <h3>Contact</h3>
                    <p>Email: support@smarttimetable.com</p>
                    <p>Academic Management System</p>
                    <p>© 2026 Smart Timetable Optimizer</p>
                </div>

            </div>

            <div className="footer-bottom">
                <p>© 2026 Smart Timetable Optimizer. All rights reserved.</p>
                <p>Designed & Developed for Academic Management</p>
            </div>

        </footer>
    );
}

export default Footer;
