import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
    Home, 
    Bookmark, 
    PenSquare, 
    Settings, 
    LogOut, 
    LogIn, 
    User,
    BookOpen
} from "lucide-react";

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    const navItemClass = (path) => `
        flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 group
        ${isActive(path) 
            ? "text-neutral-950 bg-neutral-100 font-semibold" 
            : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"}
    `;

    return (
        <aside className="w-20 md:w-24 border-r border-neutral-100 h-screen sticky top-0 flex flex-col items-center justify-between py-6 bg-white z-40">
            {/* Logo */}
            <Link to="/" className="flex items-center justify-center text-neutral-900 hover:opacity-80 transition-opacity">
                <BookOpen className="w-8 h-8 stroke-[2.5]" />
            </Link>

            {/* Main Nav Items */}
            <nav className="flex flex-col gap-4 w-full px-2">
                <Link to="/" className={navItemClass("/")} title="Home">
                    <Home className="w-6 h-6 stroke-[2]" />
                    <span className="text-[10px] mt-1 hidden md:block">Home</span>
                </Link>

                {user && (
                    <Link to="/saved" className={navItemClass("/saved")} title="Bookmarks">
                        <Bookmark className="w-6 h-6 stroke-[2]" />
                        <span className="text-[10px] mt-1 hidden md:block">Bookmarks</span>
                    </Link>
                )}

                <Link to="/write" className={navItemClass("/write")} title="Write story">
                    <PenSquare className="w-6 h-6 stroke-[2]" />
                    <span className="text-[10px] mt-1 hidden md:block">Write</span>
                </Link>

                {user && (user.role === "ADMIN" || user.role === "STAFF") && (
                    <Link to="/dashboard" className={navItemClass("/dashboard")} title="Dashboard">
                        <Settings className="w-6 h-6 stroke-[2]" />
                        <span className="text-[10px] mt-1 hidden md:block">Manage</span>
                    </Link>
                )}
            </nav>

            {/* Profile / Auth Controls */}
            <div className="flex flex-col items-center gap-6 w-full px-2">
                {user ? (
                    <div className="flex flex-col items-center gap-4">
                        {/* Profile Avatar circle with initials */}
                        <div 
                            className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-sm cursor-pointer hover:bg-neutral-800 transition-colors"
                            title={`Logged in as ${user.name} (${user.role})`}
                            onClick={() => navigate("/profile")}
                        >
                            {user.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)}
                        </div>

                        <button 
                            onClick={() => {
                                logout();
                                navigate("/");
                            }}
                            className="p-2 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-all"
                            title="Log Out"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <Link 
                        to="/login" 
                        className="flex flex-col items-center justify-center p-3 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 rounded-xl transition-all"
                        title="Sign In"
                    >
                        <LogIn className="w-6 h-6" />
                        <span className="text-[10px] mt-1 hidden md:block">Sign In</span>
                    </Link>
                )}
            </div>
        </aside>
    );
};

export default Navbar;
