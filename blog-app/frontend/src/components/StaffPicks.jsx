import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth, API_BASE } from "../context/AuthContext";
import { Sparkles, TrendingUp } from "lucide-react";

const StaffPicks = ({ onTagSelect, selectedTag }) => {
    const { token } = useAuth();
    const [picks, setPicks] = useState([]);
    const [loading, setLoading] = useState(true);

    const defaultTopics = [
        "Tech",
        "Writing",
        "Design",
        "Development",
        "React",
        "Database",
        "Life",
        "JavaScript",
        "Node",
        "CSS"
    ];

    const [topics, setTopics] = useState(defaultTopics);

    useEffect(() => {
        const fetchSidebarData = async () => {
            // 1. Fetch picks
            try {
                const res = await fetch(`${API_BASE}/api/posts?limit=3`);
                if (res.ok) {
                    const data = await res.json();
                    setPicks(data.posts.slice(0, 3));
                }
            } catch (err) {
                console.error("Error fetching picks:", err);
            } finally {
                setLoading(false);
            }

            // 2. Fetch categories dynamically
            try {
                const res = await fetch(`${API_BASE}/api/posts/categories`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.categories && data.categories.length > 0) {
                        const merged = Array.from(new Set([...defaultTopics, ...data.categories]));
                        setTopics(merged);
                    }
                }
            } catch (err) {
                console.error("Error fetching categories:", err);
            }
        };
        fetchSidebarData();
    }, []);

    return (
        <aside className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-10 py-8 lg:pl-10 lg:border-l border-neutral-100 bg-white">
            
            {/* Staff Picks Section */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <h3 className="font-bold text-neutral-900 uppercase text-xs tracking-wider">
                        Staff Picks
                    </h3>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse space-y-2">
                                <div className="h-3 bg-neutral-100 rounded w-1/3"></div>
                                <div className="h-4 bg-neutral-100 rounded w-3/4"></div>
                            </div>
                        ))}
                    </div>
                ) : picks.length === 0 ? (
                    <p className="text-sm text-neutral-400 italic">No picked stories today.</p>
                ) : (
                    <div className="space-y-5">
                        {picks.map((post) => (
                            <Link 
                                key={post.id} 
                                to={`/posts/${post.slug}`}
                                className="block group"
                            >
                                <div className="flex items-center gap-1.5 mb-1">
                                    <div className="w-4 h-4 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-[8px]">
                                        {post.author_name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)}
                                    </div>
                                    <span className="text-[11px] font-semibold text-neutral-700">{post.author_name}</span>
                                </div>
                                <h4 className="font-serif text-sm font-bold text-neutral-850 group-hover:text-neutral-600 transition-colors leading-tight">
                                    {post.title}
                                </h4>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Recommended Topics Section */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-neutral-600" />
                    <h3 className="font-bold text-neutral-900 uppercase text-xs tracking-wider">
                        Recommended topics
                    </h3>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => onTagSelect(null)}
                        className={`px-3.5 py-1.5 rounded-full text-xs transition-all font-medium ${
                            !selectedTag 
                                ? "bg-neutral-900 text-white" 
                                : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                        }`}
                    >
                        All Topics
                    </button>
                    {topics.map((topic) => (
                        <button
                            key={topic}
                            onClick={() => onTagSelect(topic)}
                            className={`px-3.5 py-1.5 rounded-full text-xs transition-all font-medium ${
                                selectedTag === topic 
                                    ? "bg-neutral-900 text-white" 
                                    : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                            }`}
                        >
                            {topic}
                        </button>
                    ))}
                </div>
            </div>

            {/* Footer rights */}
            <footer className="mt-auto border-t border-neutral-50 pt-6 text-[11px] text-neutral-400 leading-relaxed">
                <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2">
                    <a href="#" className="hover:underline">Help</a>
                    <a href="#" className="hover:underline">Status</a>
                    <a href="#" className="hover:underline">Writers</a>
                    <a href="#" className="hover:underline">Blog</a>
                    <a href="#" className="hover:underline">Careers</a>
                    <a href="#" className="hover:underline">Privacy</a>
                    <a href="#" className="hover:underline">Terms</a>
                    <a href="#" className="hover:underline">About</a>
                </div>
                <p>© 2026 Blogify / Medium Clone</p>
            </footer>
        </aside>
    );
};

export default StaffPicks;
