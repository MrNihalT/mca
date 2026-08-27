import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth, API_BASE } from "../context/AuthContext";
import CommentDrawer from "../components/CommentDrawer";
import { MessageSquare, Heart, Bookmark, Edit3, Trash2, ArrowLeft, Calendar, User } from "lucide-react";

const PostDetail = () => {
    const { slug } = useParams();
    const { token, user } = useAuth();
    const navigate = useNavigate();

    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [comments, setComments] = useState([]);
    const [isCommentDrawerOpen, setIsCommentDrawerOpen] = useState(false);
    const [isLiking, setIsLiking] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchPost = async () => {
            setLoading(true);
            try {
                const headers = {};
                if (token) {
                    headers["Authorization"] = `Bearer ${token}`;
                }

                const res = await fetch(`${API_BASE}/api/posts/${slug}`, { headers });
                if (!res.ok) {
                    throw new Error("Post not found");
                }

                const data = await res.json();
                setPost(data.post);
                setComments(data.post.comments || []);
            } catch (err) {
                console.error(err);
                navigate("/");
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [slug, token, navigate]);

    const handleLike = async () => {
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

    const handleSave = async () => {
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

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this story? This cannot be undone.")) return;

        try {
            const res = await fetch(`${API_BASE}/api/posts/${post.id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (res.ok) {
                navigate("/");
            } else {
                const data = await res.json();
                alert(data.error || "Failed to delete post");
            }
        } catch (err) {
            console.error("Delete post error:", err);
        }
    };

    // Callback when comment is created in drawer
    const handleCommentAdded = (newComment) => {
        setComments(prev => [newComment, ...prev]);
        setPost(prev => ({
            ...prev,
            comments_count: prev.comments_count + 1
        }));
    };

    // Callback when comment is deleted in drawer
    const handleCommentDeleted = (commentId) => {
        setComments(prev => prev.filter(c => c.id !== commentId));
        setPost(prev => ({
            ...prev,
            comments_count: Math.max(0, prev.comments_count - 1)
        }));
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    };

    const canManagePost = () => {
        if (!user) return false;
        if (user.role === "ADMIN" || user.role === "STAFF") return true;
        return user.id === post.author_id;
    };

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center py-20">
                <div className="animate-pulse space-y-8 w-full max-w-3xl px-4">
                    <div className="h-4 bg-neutral-100 rounded w-1/4"></div>
                    <div className="h-10 bg-neutral-100 rounded w-3/4"></div>
                    <div className="h-5 bg-neutral-100 rounded w-1/2"></div>
                    <div className="h-64 bg-neutral-100 rounded-xl w-full"></div>
                    <div className="space-y-4">
                        <div className="h-4 bg-neutral-100 rounded w-full"></div>
                        <div className="h-4 bg-neutral-100 rounded w-5/6"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!post) return null;

    // Helper placeholder image gradient
    const getPlaceholderImg = () => {
        const charCode = post.title.charCodeAt(0) % 5;
        const gradients = [
            "from-purple-400 to-indigo-500",
            "from-emerald-400 to-teal-500",
            "from-rose-400 to-pink-500",
            "from-amber-400 to-orange-500",
            "from-blue-400 to-cyan-500"
        ];
        return `bg-gradient-to-br ${gradients[charCode]}`;
    };

    return (
        <div className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-8 py-10">
            {/* Back to Home */}
            <button 
                onClick={() => navigate(-1)} 
                className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors uppercase tracking-wider mb-8"
            >
                <ArrowLeft className="w-4 h-4" />
                <span>Go Back</span>
            </button>

            {/* Post Title */}
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-black text-neutral-900 leading-[1.1] mb-6">
                {post.title}
            </h1>

            {/* Author and Date Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100 mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-sm">
                        {post.author_name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)}
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-neutral-900">{post.author_name}</span>
                            {post.author_role === "ADMIN" && (
                                <span className="text-[9px] bg-red-50 text-red-600 px-1 py-0.2 rounded font-bold uppercase">Admin</span>
                            )}
                            {post.author_role === "STAFF" && (
                                <span className="text-[9px] bg-blue-50 text-blue-600 px-1 py-0.2 rounded font-bold uppercase">Staff</span>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(post.created_at)}</span>
                            {post.category && (
                                <>
                                    <span className="text-neutral-300 text-xs">•</span>
                                    <span className="text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded-xl font-bold uppercase tracking-wider">
                                        {post.category}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Edit / Delete Options */}
                {canManagePost() && (
                    <div className="flex items-center gap-2">
                        <Link 
                            to={`/write?edit=${post.id}`} 
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-semibold text-neutral-700 hover:text-neutral-950 hover:bg-neutral-50 transition-all"
                        >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                        </Link>
                        <button 
                            onClick={handleDelete}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-100 text-xs font-semibold text-red-600 hover:bg-red-50 transition-all"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Cover Image Banner */}
            <div className="w-full h-64 md:h-96 rounded-xl overflow-hidden mb-8 bg-neutral-100 border border-neutral-100">
                {post.image ? (
                    <img 
                        src={`${API_BASE}/${post.image}`} 
                        alt={post.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.onerror = null; 
                            e.target.src = "";
                            e.target.className = `w-full h-full flex items-center justify-center text-lg font-bold text-white uppercase tracking-wider ${getPlaceholderImg()}`;
                        }}
                    />
                ) : (
                    <div className={`w-full h-full flex items-center justify-center text-lg font-bold text-white uppercase tracking-wider ${getPlaceholderImg()}`}>
                        {post.title}
                    </div>
                )}
            </div>

            {/* Social Floating Panel / Interaction Bar */}
            <div className="flex items-center justify-between py-3 border-y border-neutral-100 mb-8 sticky top-0 bg-white/95 backdrop-blur z-20">
                <div className="flex items-center gap-6">
                    <button 
                        disabled={isLiking}
                        onClick={handleLike}
                        className={`flex items-center gap-2 text-sm font-semibold transition-colors ${post.is_liked ? "text-rose-600" : "text-neutral-500 hover:text-rose-600"}`}
                    >
                        <Heart className={`w-5 h-5 ${post.is_liked ? "fill-rose-600 stroke-rose-600" : ""}`} />
                        <span>{post.likes_count} likes</span>
                    </button>

                    <button 
                        onClick={() => setIsCommentDrawerOpen(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
                    >
                        <MessageSquare className="w-5 h-5" />
                        <span>{post.comments_count} responses</span>
                    </button>
                </div>

                <button 
                    disabled={isSaving}
                    onClick={handleSave}
                    className={`p-2 rounded-full transition-colors ${post.is_saved ? "text-amber-600" : "text-neutral-400 hover:text-neutral-900"}`}
                >
                    <Bookmark className={`w-5 h-5 ${post.is_saved ? "fill-amber-600 stroke-amber-600" : ""}`} />
                </button>
            </div>

            {/* Main Article Content */}
            <article className="font-serif text-lg md:text-xl text-neutral-800 leading-relaxed mb-16 whitespace-pre-line space-y-6">
                {post.content}
            </article>

            {/* Bottom Actions card */}
            <div className="p-8 rounded-2xl bg-neutral-50 border border-neutral-100 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-base">
                        {post.author_name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)}
                    </div>
                    <div>
                        <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Written by</p>
                        <h4 className="text-base font-bold text-neutral-900 leading-tight">{post.author_name}</h4>
                    </div>
                </div>

                <button
                    onClick={() => setIsCommentDrawerOpen(true)}
                    className="w-full md:w-auto px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-neutral-950 hover:bg-neutral-800 transition-colors text-center"
                >
                    Write a response
                </button>
            </div>

            {/* Response Slide Drawer */}
            <CommentDrawer 
                isOpen={isCommentDrawerOpen} 
                onClose={() => setIsCommentDrawerOpen(false)} 
                postId={post.id}
                comments={comments}
                onCommentAdded={handleCommentAdded}
                onCommentDeleted={handleCommentDeleted}
            />
        </div>
    );
};

export default PostDetail;
