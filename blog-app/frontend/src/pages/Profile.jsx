import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, API_BASE } from "../context/AuthContext";
import { 
    User, 
    Mail, 
    Edit3, 
    Camera, 
    Save, 
    X, 
    ArrowLeft, 
    Calendar,
    Briefcase
} from "lucide-react";

const GithubIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
);

const TwitterIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
    </svg>
);

const Profile = () => {
    const { token, user, setUser } = useAuth();
    const navigate = useNavigate();

    // Form states
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState("");
    const [bio, setBio] = useState("");
    const [github, setGithub] = useState("");
    const [twitter, setTwitter] = useState("");
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Redirect guest
    useEffect(() => {
        if (!token) {
            navigate("/login");
        }
    }, [token, navigate]);

    // Populate inputs when user context loads
    useEffect(() => {
        if (user) {
            setName(user.name);
            setBio(user.bio || "");
            setGithub(user.github || "");
            setTwitter(user.twitter || "");
            if (user.avatar) {
                setAvatarPreview(`${API_BASE}/${user.avatar}`);
            } else {
                setAvatarPreview(null);
            }
        }
    }, [user, isEditing]);

    if (!user) return null;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!name.trim() || isSubmitting) return;

        setIsSubmitting(true);
        
        const formData = new FormData();
        formData.append("name", name);
        formData.append("bio", bio);
        formData.append("github", github);
        formData.append("twitter", twitter);
        if (avatarFile) {
            formData.append("avatar", avatarFile);
        }

        try {
            const res = await fetch(`${API_BASE}/api/auth/profile`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
                setIsEditing(false);
                setAvatarFile(null);
            } else {
                const errorData = await res.json();
                alert(errorData.error || "Failed to update profile.");
            }
        } catch (err) {
            console.error("Profile update error:", err);
            alert("Network error. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setAvatarFile(null);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    };

    // User initials dynamic placeholder
    const getInitials = () => {
        return user.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
    };

    return (
        <div className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-8 py-10">
            {/* Go Back button */}
            <button 
                onClick={() => navigate("/")} 
                className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors uppercase tracking-wider mb-8"
            >
                <ArrowLeft className="w-4 h-4" />
                <span>Go to Feed</span>
            </button>

            {/* Profile Card Container */}
            <div className="bg-white border border-neutral-100 rounded-2xl p-6 md:p-10 shadow-xl relative overflow-hidden">
                
                {/* Decorative background vibe line */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-neutral-900"></div>

                {isEditing ? (
                    /* EDITING VIEW FORM */
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="flex flex-col items-center gap-4 mb-6">
                            
                            {/* Avatar Editor Uploader */}
                            <div className="relative group select-none">
                                <div className="w-24 h-24 rounded-full overflow-hidden border border-neutral-100 bg-neutral-50 flex items-center justify-center font-serif text-3xl font-black text-neutral-400">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt={name} className="w-full h-full object-cover" />
                                    ) : (
                                        getInitials()
                                    )}
                                </div>
                                <label className="absolute inset-0 bg-black/40 hover:bg-black/50 text-white rounded-full flex flex-col items-center justify-center gap-1 cursor-pointer transition-all opacity-0 group-hover:opacity-100">
                                    <Camera className="w-5 h-5" />
                                    <span className="text-[10px] font-semibold uppercase">Change</span>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleFileChange} 
                                        className="hidden" 
                                    />
                                </label>
                            </div>
                            <span className="text-xs text-neutral-400">Allowed formats: PNG, JPG, JPEG, WEBP</span>
                        </div>

                        {/* Name Input */}
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full text-sm px-4 py-2.5 bg-neutral-50 border border-neutral-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-all text-neutral-800"
                                required
                            />
                        </div>

                        {/* Bio Textarea */}
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                                Bio / Description
                            </label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Describe yourself, your stack, your programming philosophies..."
                                rows="4"
                                className="w-full text-sm px-4 py-2.5 bg-neutral-50 border border-neutral-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-all text-neutral-800 resize-none"
                            />
                        </div>

                        {/* Social Inputs Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                                    GitHub Username
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={github}
                                        onChange={(e) => setGithub(e.target.value)}
                                        placeholder="octocat"
                                        className="w-full text-sm pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-all text-neutral-800"
                                    />
                                    <GithubIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                                    Twitter Handle
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={twitter}
                                        onChange={(e) => setTwitter(e.target.value)}
                                        placeholder="twitter_user"
                                        className="w-full text-sm pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-all text-neutral-800"
                                    />
                                    <TwitterIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                </div>
                            </div>
                        </div>

                        {/* Edit Buttons Bar */}
                        <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-100">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-500 hover:text-neutral-900 border border-neutral-200 hover:bg-neutral-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !name.trim()}
                                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                            >
                                <Save className="w-3.5 h-3.5" />
                                <span>{isSubmitting ? "Saving..." : "Save Profile"}</span>
                            </button>
                        </div>
                    </form>
                ) : (
                    /* PUBLIC / READ PROFILE VIEW */
                    <div className="flex flex-col md:flex-row items-start gap-8">
                        {/* Left Column: Avatar */}
                        <div className="w-24 h-24 rounded-full overflow-hidden border border-neutral-100 flex-shrink-0 bg-neutral-900 text-white flex items-center justify-center font-bold text-3xl select-none">
                            {user.avatar ? (
                                <img src={`${API_BASE}/${user.avatar}`} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                getInitials()
                            )}
                        </div>

                        {/* Right Column: Bio and Settings */}
                        <div className="flex-1 space-y-5">
                            
                            {/* Profile Info Header */}
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                        <h2 className="font-serif text-2xl md:text-3xl font-black text-neutral-900 leading-tight">
                                            {user.name}
                                        </h2>
                                        {user.role === "ADMIN" && (
                                            <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Admin</span>
                                        )}
                                        {user.role === "STAFF" && (
                                            <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Staff</span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-500">
                                        <div className="flex items-center gap-1">
                                            <Mail className="w-4 h-4" />
                                            <span>{user.email}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            <span>Joined {formatDate(user.created_at)}</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 hover:text-neutral-950 hover:bg-neutral-50 transition-all shadow-sm"
                                >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>Edit Profile</span>
                                </button>
                            </div>

                            <hr className="border-neutral-100" />

                            {/* Bio Block */}
                            <div>
                                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">About Me</h4>
                                {user.bio ? (
                                    <p className="text-sm md:text-base text-neutral-700 leading-relaxed whitespace-pre-line">
                                        {user.bio}
                                    </p>
                                ) : (
                                    <p className="text-sm text-neutral-400 italic">No bio written yet. Click 'Edit Profile' to share your story!</p>
                                )}
                            </div>

                            {/* Social Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                {/* Github */}
                                {user.github ? (
                                    <a 
                                        href={`https://github.com/${user.github}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 p-3 border border-neutral-100 rounded-xl hover:bg-neutral-50 hover:border-neutral-200 transition-all group"
                                    >
                                        <GithubIcon className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                                        <span className="text-xs font-semibold text-neutral-700 truncate">{user.github}</span>
                                    </a>
                                ) : (
                                    <div className="flex items-center gap-2 p-3 border border-neutral-50 border-dashed rounded-xl text-neutral-400 text-xs">
                                        <GithubIcon className="w-4 h-4 opacity-50" />
                                        <span>No GitHub linked</span>
                                    </div>
                                )}

                                {/* Twitter */}
                                {user.twitter ? (
                                    <a 
                                        href={`https://twitter.com/${user.twitter}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 p-3 border border-neutral-100 rounded-xl hover:bg-neutral-50 hover:border-neutral-200 transition-all group"
                                    >
                                        <TwitterIcon className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                                        <span className="text-xs font-semibold text-neutral-700 truncate">@{user.twitter}</span>
                                    </a>
                                ) : (
                                    <div className="flex items-center gap-2 p-3 border border-neutral-50 border-dashed rounded-xl text-neutral-400 text-xs">
                                        <TwitterIcon className="w-4 h-4 opacity-50" />
                                        <span>No Twitter linked</span>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Profile;
