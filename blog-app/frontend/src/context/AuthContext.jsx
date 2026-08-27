import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export const API_BASE = "";

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token") || null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyUser = async () => {
            try {
                // Fetch /me relying on the HttpOnly cookie
                const res = await fetch(`${API_BASE}/api/auth/me`);

                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                } else {
                    // Cookie is invalid/expired or not set
                    localStorage.removeItem("token");
                    setUser(null);
                    setToken(null);
                }
            } catch (err) {
                console.error("Auth verification failed:", err);
                setUser(null);
                setToken(null);
            } finally {
                setLoading(false);
            }
        };

        verifyUser();
    }, [token]);

    const login = async (email, password) => {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Login failed");
        }

        localStorage.setItem("token", data.token);
        setToken(data.token);
        setUser(data.user);
        return data.user;
    };

    const register = async (name, email, password) => {
        const res = await fetch(`${API_BASE}/api/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Registration failed");
        }

        localStorage.setItem("token", data.token);
        setToken(data.token);
        setUser(data.user);
        return data.user;
    };

    const logout = async () => {
        try {
            await fetch(`${API_BASE}/api/auth/logout`, { method: "POST" });
        } catch (err) {
            console.error("Logout request failed:", err);
        }
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
