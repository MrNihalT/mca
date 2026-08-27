import React, { useState, useEffect } from "react";
import { useAuth, API_BASE } from "../context/AuthContext";
import PostCard from "../components/PostCard";
import StaffPicks from "../components/StaffPicks";
import { Search, Sparkles, BookOpen, PenSquare } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const Home = () => {
    const { user, token } = useAuth();
    const location = useLocation();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTag, setSelectedTag] = useState(null);
    const [sortBy, setSortBy] = useState("newest");
    const [activeTab, setActiveTab] = useState(location.pathname === "/saved" ? "saved" : "for_you"); // for_you, my_posts, saved, liked

    // Sync tab with URL path (e.g. clicking navbar bookmarks)
    useEffect(() => {
        if (location.pathname === "/saved") {
            setActiveTab("saved");
        } else if (location.pathname === "/") {
            setActiveTab("for_you");
        }
    }, [location.pathname]);

    // Fetch posts whenever filter states change
    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            try {
                let url = `${API_BASE}/api/posts?`;
                const params = new URLSearchParams();

                // Set tab parameters
                if (activeTab === "my_posts" && user) {
                    params.append("authorId", user.id);
                } else if (activeTab === "saved" && user) {
                    params.append("saved", "true");
                } else if (activeTab === "liked" && user) {
                    params.append("liked", "true");
                }

                // Add search query
                if (searchQuery) {
                    params.append("search", searchQuery);
                }

                // Add category filter
                if (selectedTag) {
                    params.append("category", selectedTag);
                }

                // Add sorting option
                if (sortBy) {
                    params.append("sort", sortBy);
                }

                url += params.toString();

                const headers = {};
                if (token) {
                    headers["Authorization"] = `Bearer ${token}`;
                }

                const res = await fetch(url, { headers });
                if (res.ok) {
                    const data = await res.json();
                    setPosts(data.posts);
                }
            } catch (err) {
                console.error("Error fetching posts:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, [activeTab, selectedTag, searchQuery, sortBy, token, user]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        // Triggered automatically via state dependency
    };

    const handleTagSelect = (tag) => {
        setSelectedTag(tag);
        // Clear general search query to avoid conflicts
        setSearchQuery("");
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        // Reset tag filter on tab change
        setSelectedTag(null);
    };

    return (
        <div className="flex-1 flex flex-col lg:flex-row px-4 md:px-8 max-w-7xl mx-auto w-full">
            
            {/* Left Feed Section */}
            <main className="flex-1 lg:pr-10 py-8 border-r border-neutral-50">
                
                {/* Search Bar Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="font-serif text-3xl font-extrabold text-neutral-900 tracking-tight mb-1">
                            Blog App Stories
                        </h1>
                        <p className="text-sm text-neutral-500">Explore, share, and expand your coding perspective.</p>
                    </div>

                    <form onSubmit={handleSearchSubmit} className="relative w-full md:w-64">
                        <input
                            type="text"
                            placeholder="Search articles..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if (selectedTag) setSelectedTag(null); // Clear tag if user starts typing
                            }}
                            className="w-full text-sm pl-10 pr-4 py-2 bg-neutral-50 hover:bg-neutral-100/80 focus:bg-white border border-neutral-100 rounded-full focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-all text-neutral-800"
                        />
                        <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </form>
                </div>

                {/* Tabs */}
                <div className="border-b border-neutral-100 mb-6 flex overflow-x-auto select-none">
                    <button
                        onClick={() => handleTabChange("for_you")}
                        className={`pb-3.5 px-1 mr-6 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                            activeTab === "for_you"
                                ? "border-neutral-900 text-neutral-900"
                                : "border-transparent text-neutral-400 hover:text-neutral-900"
                        }`}
                    >
                        For you
                    </button>

                    {user && (
                        <>
                            <button
                                onClick={() => handleTabChange("my_posts")}
                                className={`pb-3.5 px-1 mr-6 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                                    activeTab === "my_posts"
                                        ? "border-neutral-900 text-neutral-900"
                                        : "border-transparent text-neutral-400 hover:text-neutral-900"
                                }`}
                            >
                                My Stories
                            </button>

                            <button
                                onClick={() => handleTabChange("saved")}
                                className={`pb-3.5 px-1 mr-6 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                                    activeTab === "saved"
                                        ? "border-neutral-900 text-neutral-900"
                                        : "border-transparent text-neutral-400 hover:text-neutral-900"
                                }`}
                            >
                                Bookmarks
                            </button>

                            <button
                                onClick={() => handleTabChange("liked")}
                                className={`pb-3.5 px-1 mr-6 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                                    activeTab === "liked"
                                        ? "border-neutral-900 text-neutral-900"
                                        : "border-transparent text-neutral-400 hover:text-neutral-900"
                                }`}
                            >
                                Liked Stories
                            </button>
                        </>
                    )}
                </div>

                {/* Active Filters & Sort Order Bar */}
                <div className="flex items-center justify-between text-xs text-neutral-500 mb-6 bg-neutral-50/60 px-4 py-2.5 rounded-xl border border-neutral-100/50">
                    <div className="flex items-center gap-2 flex-wrap">
                        {selectedTag && (
                            <span className="bg-neutral-900 text-white font-bold px-2 py-0.5 rounded uppercase tracking-wider text-[9px] flex items-center gap-1">
                                <span>Topic: {selectedTag}</span>
                                <button onClick={() => setSelectedTag(null)} className="hover:text-red-300 font-bold text-xs">×</button>
                            </span>
                        )}
                        {searchQuery && (
                            <span className="bg-neutral-900 text-white font-bold px-2 py-0.5 rounded uppercase tracking-wider text-[9px] flex items-center gap-1">
                                <span>Search: "{searchQuery}"</span>
                                <button onClick={() => setSearchQuery("")} className="hover:text-red-300 font-bold text-xs">×</button>
                            </span>
                        )}
                        {(!selectedTag && !searchQuery) && (
                            <span className="text-neutral-400 uppercase tracking-wider text-[10px] font-bold">Showing All Stories</span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="font-semibold uppercase tracking-wider text-[9px] text-neutral-400">Sort:</span>
                        <select 
                            value={sortBy} 
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-transparent border-none text-neutral-800 font-bold focus:ring-0 p-0 outline-none cursor-pointer uppercase tracking-wider text-[10px]"
                        >
                            <option value="newest">Newest</option>
                            <option value="trending">Trending (7 Days)</option>
                            <option value="random">Random</option>
                        </select>
                    </div>
                </div>

                {/* Feed Posts */}
                <div className="space-y-2">
                    {loading ? (
                        <div className="space-y-8">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="animate-pulse flex gap-6 py-8 border-b border-neutral-50">
                                    <div className="flex-1 space-y-4">
                                        <div className="h-4 bg-neutral-100 rounded w-1/4"></div>
                                        <div className="h-6 bg-neutral-100 rounded w-3/4"></div>
                                        <div className="h-4 bg-neutral-100 rounded w-5/6"></div>
                                    </div>
                                    <div className="w-32 h-32 bg-neutral-100 rounded-lg"></div>
                                </div>
                            ))}
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-16 px-4 flex flex-col items-center justify-center">
                            <BookOpen className="w-12 h-12 text-neutral-300 stroke-[1.5] mb-4" />
                            <h3 className="font-serif text-lg font-bold text-neutral-800 mb-1">No stories found</h3>
                            <p className="text-sm text-neutral-400 max-w-sm mb-6">
                                {searchQuery || selectedTag 
                                    ? "We couldn't find any stories matching your search. Try refining your keywords."
                                    : activeTab === "saved" 
                                    ? "You haven't bookmarked any stories yet. Save articles to read them later."
                                    : activeTab === "liked"
                                    ? "Stories you like will appear here. Spread some support!"
                                    : "Be the first to share a story with the community!"}
                            </p>
                            {!searchQuery && !selectedTag && activeTab === "for_you" && (
                                <Link 
                                    to="/write" 
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-neutral-950 hover:bg-neutral-800 transition-colors"
                                >
                                    <PenSquare className="w-4 h-4" />
                                    <span>Write a story</span>
                                </Link>
                            )}
                        </div>
                    ) : (
                        posts.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))
                    )}
                </div>
            </main>

            {/* Right Sidebar Section */}
            <StaffPicks onTagSelect={handleTagSelect} selectedTag={selectedTag} />
        </div>
    );
};

export default Home;
