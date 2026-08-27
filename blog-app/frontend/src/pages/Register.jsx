import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BookOpen, UserPlus, ArrowRight, AlertCircle } from "lucide-react";

const Register = () => {
    const { register, token } = useAuth();
    const navigate = useNavigate();

    // Redirect if already logged in
    React.useEffect(() => {
        if (token) navigate("/");
    }, [token, navigate]);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            await register(name, email, password);
            navigate("/");
        } catch (err) {
            setError(err.message || "Registration failed. Email might already be in use.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 flex items-center justify-center py-20 px-4 select-none">
            <div className="w-full max-w-md bg-white border border-neutral-100 p-8 rounded-2xl shadow-xl flex flex-col items-center">
                
                {/* Logo & Header */}
                <div className="flex flex-col items-center mb-8 text-center">
                    <div className="p-3 bg-neutral-50 rounded-xl mb-3">
                        <BookOpen className="w-8 h-8 text-neutral-900 stroke-[2.5]" />
                    </div>
                    <h2 className="font-serif text-2xl font-black text-neutral-900">Create Account</h2>
                    <p className="text-sm text-neutral-400 mt-1">Start writing stories and connecting with developers.</p>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="w-full flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-xs font-semibold mb-6 border border-red-100/50">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="w-full space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                            Full Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            className="w-full text-sm px-4 py-2.5 bg-neutral-50 border border-neutral-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-all text-neutral-800"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="john@example.com"
                            className="w-full text-sm px-4 py-2.5 bg-neutral-50 border border-neutral-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-all text-neutral-800"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full text-sm px-4 py-2.5 bg-neutral-50 border border-neutral-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-all text-neutral-800"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 mt-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
                    >
                        {isLoading ? "Creating account..." : "Sign Up"}
                        {!isLoading && <ArrowRight className="w-4 h-4" />}
                    </button>
                </form>

                {/* Bottom link */}
                <p className="text-xs text-neutral-400 mt-8">
                    Already have an account?{" "}
                    <Link to="/login" className="text-neutral-950 font-bold hover:underline">
                        Sign in here
                    </Link>
                </p>
                
            </div>
        </div>
    );
};

export default Register;
