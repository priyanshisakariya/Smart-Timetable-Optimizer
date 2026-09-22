import { useState } from "react";

import Navbar from "../../../components/Navbar";
import Sidebar from "../../../components/Sidebar";
import Footer from "../../../components/Footer";

import "./AdminLayout.css";
//AdminLayout can receive content from another component.
function AdminLayout({ children }) { //children- Display whatever content was passed into the layout

    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleMenuClick = () => {
        setSidebarOpen(!sidebarOpen);
    };

    

    return (
        <div className="admin-layout">

            <Navbar onMenuClick={handleMenuClick} />

            <div className="admin-body">

                {sidebarOpen && <Sidebar />}

                <main className="admin-content">
                    {children}
                </main>

            </div>

            <Footer />

        </div>
    );
}

export default AdminLayout;