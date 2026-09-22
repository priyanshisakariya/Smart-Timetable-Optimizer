import { useState } from "react";

import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import Footer from "../../components/Footer";

import "./StudentLayout.css";

function StudentLayout({ children }) {

    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleMenuClick = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="student-layout">

            <Navbar
                onMenuClick={handleMenuClick}
                role="student"
            />

            <div className="student-body">

                {sidebarOpen && (
                    <Sidebar role="student" />
                )}

                <main className="student-content">
                    {children}
                </main>

            </div>

            <Footer />

        </div>
    );
}

export default StudentLayout;