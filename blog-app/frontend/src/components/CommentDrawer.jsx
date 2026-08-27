import React, { useState } from "react";
import { X, Trash2, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth, API_BASE } from "../context/AuthContext";

const CommentDrawer = ({ isOpen, onClose, postId, comments, onCommentAdded, onCommentDeleted }) => {
    const { token, user } = useAuth();
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/api/comments/${postId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ content })
            });

            if (res.ok) {
                const data = await res.json();
                onCommentAdded(data.comment);
                setContent("");
            }
        } catch (err) {
            console.error("Error adding comment:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (commentId) => {
        if (!window.confirm("Are you sure you want to delete this response?")) return;

        try {
            const res = await fetch(`${API_BASE}/api/comments/${commentId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (res.ok) {
                onCommentDeleted(commentId);
            }
        } catch (err) {
            console.error("Error deleting comment:", err);
        }
    };

    // Format date nicely
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    };

    const canDeleteComment = (comment) => {
        if (!user) return false;
        if (user.role === "ADMIN" || user.role === "STAFF") return true;
        return user.id === comment.user_id;
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end select-none">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-neutral-900/20 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Drawer Content */}
            <div className="w-full max-w-md h-full bg-white relative z-10 flex flex-col shadow-2xl animate-slide-in border-l border-neutral-100">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-100">
                    <h3 className="text-lg font-bold text-neutral-900">
                        Responses ({comments.length})
                    </h3>
                    <button 
                        onClick={onClose}
                        className="p-1 rounded-full text-neutral-400 hover:text-neutral-800 hover:bg-neutral-50 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Main Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    
                    {/* Add Comment Form */}
                    {user ? (
                        <form onSubmit={handleSubmit} className="p-4 rounded-xl border border-neutral-100 bg-neutral-50 flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-[10px]">
                                    {user.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)}
                                </div>
                                <span className="text-xs font-semibold text-neutral-700">{user.name}</span>
                            </div>

                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="What are your thoughts?"
                                rows="3"
                                className="w-full text-sm bg-transparent border-none focus:ring-0 p-0 text-neutral-800 placeholder-neutral-400 resize-none outline-none"
                                required
                            />

                            <div className="flex justify-end border-t border-neutral-100/80 pt-2">
                                <button
                                    type="submit"
                                    disabled={!content.trim() || isSubmitting}
                                    className="px-4 py-1.5 rounded-full text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 transition-colors"
                                >
                                    {isSubmitting ? "Responding..." : "Respond"}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="p-4 rounded-xl border border-dashed border-neutral-200 text-center flex flex-col items-center gap-2">
                            <p className="text-sm text-neutral-500">Sign in to share your thoughts on this story.</p>
                            <Link 
                                to="/login"
                                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 transition-colors"
                                onClick={onClose}
                            >
                                <LogIn className="w-3.5 h-3.5" />
                                <span>Sign In</span>
                            </Link>
                        </div>
                    )}

                    {/* Comments List */}
                    <div className="space-y-6">
                        {comments.length === 0 ? (
                            <p className="text-center text-sm text-neutral-400 italic">No responses yet. Be the first to share your thoughts!</p>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment.id} className="group/comment flex flex-col gap-2 pb-5 border-b border-neutral-50 last:border-0 last:pb-0">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-[10px]">
                                                {comment.user_name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-semibold text-neutral-800 hover:underline cursor-pointer">{comment.user_name}</span>
                                                <span className="text-[10px] text-neutral-400">{formatDate(comment.created_at)}</span>
                                            </div>
                                        </div>

                                        {canDeleteComment(comment) && (
                                            <button
                                                onClick={() => handleDelete(comment.id)}
                                                className="p-1 rounded-md text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover/comment:opacity-100"
                                                title="Delete response"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-sm text-neutral-700 leading-relaxed pl-9 whitespace-pre-line">
                                        {comment.content}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Slide In CSS keyframes animation */}
            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in {
                    animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
};

export default CommentDrawer;
