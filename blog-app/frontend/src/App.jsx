import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import PostDetail from "./pages/PostDetail";
import WritePost from "./pages/WritePost";
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";

// Loading component during user check
const AuthLoadingGuard = ({ children }) => {
    const { loading } = useAuth();
    if (loading) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-white">
                <div className="animate-pulse flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin"></div>
                    <span className="text-sm font-semibold text-neutral-500">Checking session...</span>
                </div>
            </div>
        );
    }
    return children;
};

function AppContent() {
    return (
        <div className="min-h-screen w-full bg-white flex text-neutral-800 font-sans">
            <Router>
                {/* Left Sidebar */}
                <Navbar />

                {/* Main Content Area */}
                <div className="flex-1 min-h-screen overflow-y-auto bg-white flex flex-col">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/saved" element={<Home />} />
                        <Route path="/posts/:slug" element={<PostDetail />} />
                        <Route path="/write" element={<WritePost />} />
                        <Route path="/dashboard" element={<AdminDashboard />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        {/* Fallback */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </Router>
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <AuthLoadingGuard>
                <AppContent />
            </AuthLoadingGuard>
        </AuthProvider>
    );
}

export default App;
