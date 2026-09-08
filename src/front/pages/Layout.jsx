import { Outlet } from "react-router-dom";
import ScrollToTop from "../components/ScrollToTop";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

export const Layout = () => {
    return (
        <ScrollToTop>
            <div className="app-shell">
                <Navbar />
                <div className="app-content">
                    <Outlet />
                </div>
                <Footer />
            </div>
        </ScrollToTop>
    );
};
