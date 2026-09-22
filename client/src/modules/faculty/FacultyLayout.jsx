import { useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import Footer from "../../components/Footer";
import "./FacultyLayout.css";

function FacultyLayout({ children }) {

    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleMenuClick = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="faculty-layout">

            <Navbar
                onMenuClick={handleMenuClick}
                role="faculty"
            />

            <div className="faculty-body">

                {sidebarOpen && (
                    <Sidebar role="faculty" />
                )}

                <main className="faculty-content">
                    {children}
                </main>

            </div>

            <Footer />

        </div>
    );
}

export default FacultyLayout;