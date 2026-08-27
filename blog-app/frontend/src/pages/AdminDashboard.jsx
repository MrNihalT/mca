import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth, API_BASE } from "../context/AuthContext";
import { Users, FileText, Trash2, Edit3, ShieldAlert, Award, UserMinus } from "lucide-react";

const AdminDashboard = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();

    const [posts, setPosts] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [activeTab, setActiveTab] = useState("posts"); // posts, users

    // Redirect guest or regular user
    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }
        if (user && user.role !== "ADMIN" && user.role !== "STAFF") {
            navigate("/");
        }
    }, [token, user, navigate]);

    // Fetch all posts
    const fetchPosts = async () => {
        setLoadingPosts(true);
        try {
            const res = await fetch(`${API_BASE}/api/posts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPosts(data.posts);
            }
        } catch (err) {
            console.error("Error fetching admin posts:", err);
        } finally {
            setLoadingPosts(false);
        }
    };

    // Fetch all users (ADMIN only)
    const fetchUsers = async () => {
        if (user?.role !== "ADMIN") return;
        setLoadingUsers(true);
        try {
            const res = await fetch(`${API_BASE}/api/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsersList(data.users);
            }
        } catch (err) {
            console.error("Error fetching admin users:", err);
        } finally {
            setLoadingUsers(false);
        }
    };

    useEffect(() => {
        if (token && user) {
            fetchPosts();
            if (user.role === "ADMIN") {
                fetchUsers();
            }
        }
    }, [token, user]);

    const handlePostDelete = async (postId) => {
        if (!window.confirm("Are you sure you want to delete this story?")) return;

        try {
            const res = await fetch(`${API_BASE}/api/posts/${postId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                setPosts(prev => prev.filter(p => p.id !== postId));
            } else {
                alert("Failed to delete post.");
            }
        } catch (err) {
            console.error("Delete post error:", err);
        }
    };

    const handleRoleChange = async (targetUserId, newRole) => {
        try {
            const res = await fetch(`${API_BASE}/api/users/${targetUserId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ role: newRole })
            });

            if (res.ok) {
                const data = await res.json();
                setUsersList(prev => prev.map(u => u.id === targetUserId ? { ...u, role: data.user.role } : u));
            } else {
                const data = await res.json();
                alert(data.error || "Failed to update role.");
            }
        } catch (err) {
            console.error("Role update error:", err);
        }
    };

    const handleUserDelete = async (targetUserId) => {
        if (targetUserId === user.id) {
            alert("You cannot delete your own admin account.");
            return;
        }
        if (!window.confirm("Are you sure you want to delete this user? All their posts and comments will be deleted!")) return;

        try {
            const res = await fetch(`${API_BASE}/api/users/${targetUserId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                setUsersList(prev => prev.filter(u => u.id !== targetUserId));
                // Reload posts to reflect deleted user's posts removal
                fetchPosts();
            } else {
                const data = await res.json();
                alert(data.error || "Failed to delete user.");
            }
        } catch (err) {
            console.error("Delete user error:", err);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    return (
        <div className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-8 py-10">
            <div className="mb-8">
                <h1 className="font-serif text-3xl font-extrabold text-neutral-900 mb-1">Control Panel</h1>
                <p className="text-sm text-neutral-500">Manage publications, edit roles, and review community operations.</p>
            </div>

            {/* Dashboard Tabs */}
            <div className="border-b border-neutral-100 mb-6 flex select-none">
                <button
                    onClick={() => setActiveTab("posts")}
                    className={`pb-3.5 px-1 mr-6 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                        activeTab === "posts"
                            ? "border-neutral-900 text-neutral-900"
                            : "border-transparent text-neutral-400 hover:text-neutral-900"
                    }`}
                >
                    <FileText className="w-4 h-4" />
                    <span>Manage Posts ({posts.length})</span>
                </button>

                {user && user.role === "ADMIN" && (
                    <button
                        onClick={() => setActiveTab("users")}
                        className={`pb-3.5 px-1 mr-6 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                            activeTab === "users"
                                ? "border-neutral-900 text-neutral-900"
                                : "border-transparent text-neutral-400 hover:text-neutral-900"
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        <span>Manage Users ({usersList.length})</span>
                    </button>
                )}
            </div>

            {/* Posts Management Table */}
            {activeTab === "posts" && (
                <div className="bg-white border border-neutral-100 rounded-xl overflow-hidden shadow-sm">
                    {loadingPosts ? (
                        <div className="p-8 text-center text-sm text-neutral-400 animate-pulse">Loading all stories...</div>
                    ) : posts.length === 0 ? (
                        <div className="p-8 text-center text-sm text-neutral-400 italic">No stories published yet.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-neutral-50 text-[10px] uppercase font-bold text-neutral-500 tracking-wider border-b border-neutral-100">
                                        <th className="p-4">Title</th>
                                        <th className="p-4">Author</th>
                                        <th className="p-4">Created At</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-50 text-sm">
                                    {posts.map((post) => (
                                        <tr key={post.id} className="hover:bg-neutral-50/50 transition-colors">
                                            <td className="p-4 font-semibold text-neutral-900 max-w-xs truncate">
                                                <Link to={`/posts/${post.slug}`} className="hover:underline">
                                                    {post.title}
                                                </Link>
                                            </td>
                                            <td className="p-4 text-neutral-600">
                                                <div className="flex items-center gap-1.5">
                                                    <span>{post.author_name}</span>
                                                    {post.author_role === "ADMIN" && (
                                                        <span className="text-[8px] bg-red-50 text-red-600 px-1 rounded uppercase font-bold">Admin</span>
                                                    )}
                                                    {post.author_role === "STAFF" && (
                                                        <span className="text-[8px] bg-blue-50 text-blue-600 px-1 rounded uppercase font-bold">Staff</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-neutral-400 text-xs">{formatDate(post.created_at)}</td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link 
                                                        to={`/write?edit=${post.id}`}
                                                        className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                                                        title="Edit story"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handlePostDelete(post.id)}
                                                        className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                        title="Delete story"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Users Management Table */}
            {activeTab === "users" && user && user.role === "ADMIN" && (
                <div className="bg-white border border-neutral-100 rounded-xl overflow-hidden shadow-sm">
                    {loadingUsers ? (
                        <div className="p-8 text-center text-sm text-neutral-400 animate-pulse">Loading all users...</div>
                    ) : usersList.length === 0 ? (
                        <div className="p-8 text-center text-sm text-neutral-400 italic">No registered users.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-neutral-50 text-[10px] uppercase font-bold text-neutral-500 tracking-wider border-b border-neutral-100">
                                        <th className="p-4">Name</th>
                                        <th className="p-4">Email</th>
                                        <th className="p-4">Role</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-50 text-sm">
                                    {usersList.map((targetUser) => (
                                        <tr key={targetUser.id} className="hover:bg-neutral-50/50 transition-colors">
                                            <td className="p-4 font-semibold text-neutral-900">{targetUser.name}</td>
                                            <td className="p-4 text-neutral-600">{targetUser.email}</td>
                                            <td className="p-4 text-neutral-800 font-medium">
                                                {targetUser.id === user.id ? (
                                                    <span className="text-xs bg-neutral-900 text-white px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                                                        You ({targetUser.role})
                                                    </span>
                                                ) : (
                                                    <select
                                                        value={targetUser.role}
                                                        onChange={(e) => handleRoleChange(targetUser.id, e.target.value)}
                                                        className="text-xs bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-400 cursor-pointer font-semibold uppercase tracking-wider text-neutral-700"
                                                    >
                                                        <option value="USER">User</option>
                                                        <option value="STAFF">Staff</option>
                                                        <option value="ADMIN">Admin</option>
                                                    </select>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                {targetUser.id !== user.id && (
                                                    <button
                                                        onClick={() => handleUserDelete(targetUser.id)}
                                                        className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors inline-flex items-center gap-1.5"
                                                        title="Delete user account"
                                                    >
                                                        <UserMinus className="w-4 h-4" />
                                                        <span className="text-xs font-semibold hidden md:inline">Delete</span>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
