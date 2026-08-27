import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageSquare, Heart, Bookmark, AlertCircle } from "lucide-react";
import { useAuth, API_BASE } from "../context/AuthContext";

const PostCard = ({ post: initialPost }) => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    
    const [post, setPost] = useState(initialPost);
    const [isLiking, setIsLiking] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Format date nicely
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    // Strip HTML/markdown tags to create plain text excerpt
    const getExcerpt = (text, maxLength = 160) => {
        const plainText = text.replace(/<[^>]*>/g, "").replace(/[#*`_\[\]]/g, "");
        if (plainText.length <= maxLength) return plainText;
        return plainText.substring(0, maxLength) + "...";
    };

    const handleLike = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!token) {
            navigate("/login");
            return;
        }

        setIsLiking(true);
        try {
            const res = await fetch(`${API_BASE}/api/posts/${post.id}/like`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setPost(prev => ({
                    ...prev,
                    is_liked: data.liked,
                    likes_count: data.likes_count
                }));
            }
        } catch (err) {
            console.error("Like toggle error:", err);
        } finally {
            setIsLiking(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!token) {
            navigate("/login");
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch(`${API_BASE}/api/posts/${post.id}/save`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setPost(prev => ({
                    ...prev,
                    is_saved: data.saved
                }));
            }
        } catch (err) {
            console.error("Save toggle error:", err);
        } finally {
            setIsSaving(false);
        }
    };

    // Get placeholder image based on title character code
    const getPlaceholderImg = () => {
        const charCode = post.title.charCodeAt(0) % 5;
        const gradients = [
            "from-purple-400 to-indigo-500",
            "from-emerald-400 to-teal-500",
            "from-rose-400 to-pink-500",
            "from-amber-400 to-orange-500",
            "from-blue-400 to-cyan-500"
        ];
        return `bg-gradient-to-br ${gradients[charCode]} opacity-80`;
    };

    return (
        <article className="py-8 border-b border-neutral-100 flex flex-col md:flex-row gap-6 items-start justify-between group cursor-pointer" onClick={() => navigate(`/posts/${post.slug}`)}>
            <div className="flex-1 flex flex-col justify-between">
                {/* Author Info */}
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-[10px]">
                        {post.author_name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)}
                    </div>
                    <span className="text-sm font-semibold text-neutral-800 hover:underline">{post.author_name}</span>
                    <span className="text-neutral-300 text-xs">•</span>
                    <span className="text-xs text-neutral-500">{formatDate(post.created_at)}</span>
                    {post.category && (
                        <>
                            <span className="text-neutral-300 text-xs">•</span>
                            <span className="text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded-xl font-bold uppercase tracking-wider">
                                {post.category}
                            </span>
                        </>
                    )}
                    {post.author_role === "ADMIN" && (
                        <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Admin</span>
                    )}
                    {post.author_role === "STAFF" && (
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Staff</span>
                    )}
                </div>

                {/* Title and Excerpt */}
                <div className="mb-4">
                    <h2 className="text-xl md:text-2xl font-bold font-serif text-neutral-900 group-hover:text-neutral-700 transition-colors mb-2 leading-tight">
                        {post.title}
                    </h2>
                    <p className="text-neutral-600 text-sm md:text-base leading-relaxed line-clamp-3 md:line-clamp-2">
                        {getExcerpt(post.content)}
                    </p>
                </div>

                {/* Footer Interactions */}
                <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-6 text-neutral-500 text-sm">
                        {/* Likes */}
                        <button 
                            disabled={isLiking}
                            onClick={handleLike}
                            className={`flex items-center gap-1.5 group/btn transition-colors ${post.is_liked ? "text-rose-600 font-medium" : "hover:text-rose-600"}`}
                        >
                            <Heart className={`w-4 h-4 transition-transform group-hover/btn:scale-110 ${post.is_liked ? "fill-rose-600 stroke-rose-600" : ""}`} />
                            <span>{post.likes_count}</span>
                        </button>

                        {/* Comments */}
                        <div className="flex items-center gap-1.5 hover:text-neutral-800 transition-colors">
                            <MessageSquare className="w-4 h-4" />
                            <span>{post.comments_count}</span>
                        </div>
                    </div>

                    {/* Bookmark Save */}
                    <button 
                        disabled={isSaving}
                        onClick={handleSave}
                        className={`p-1.5 rounded-full transition-colors ${post.is_saved ? "text-amber-600" : "text-neutral-400 hover:text-neutral-800 hover:bg-neutral-50"}`}
                        title={post.is_saved ? "Remove bookmark" : "Bookmark story"}
                    >
                        <Bookmark className={`w-5 h-5 ${post.is_saved ? "fill-amber-600 stroke-amber-600" : ""}`} />
                    </button>
                </div>
            </div>

            {/* Thumbnail Cover Image */}
            <div className="w-full md:w-32 h-32 md:h-32 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-100 border border-neutral-100 select-none">
                {post.image ? (
                    <img 
                        src={`${API_BASE}/${post.image}`} 
                        alt={post.title} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                            e.target.onerror = null; 
                            e.target.src = "";
                            e.target.className = `w-full h-full flex items-center justify-center text-xs ${getPlaceholderImg()}`;
                        }}
                    />
                ) : (
                    <div className={`w-full h-full flex items-center justify-center text-xs font-bold text-white uppercase tracking-wider ${getPlaceholderImg()}`}>
                        {post.title.substring(0, 2)}
                    </div>
                )}
            </div>
        </article>
    );
};

export default PostCard;
