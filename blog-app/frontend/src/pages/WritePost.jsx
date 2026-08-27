import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth, API_BASE } from "../context/AuthContext";
import { Upload, X, ArrowLeft, Image as ImageIcon, FileText } from "lucide-react";

const WritePost = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get("edit");

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState("Tech");
    const [customCategory, setCustomCategory] = useState("");
    const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    // Redirect to login if guest
    useEffect(() => {
        if (!token) {
            navigate("/login");
        }
    }, [token, navigate]);

    // Load post details if in edit mode
    useEffect(() => {
        if (!editId || !token) return;

        const loadPostToEdit = async () => {
            setLoading(true);
            try {
                // Fetch all posts belonging to the user to find the matching edit ID
                // Or fetch by ID. (Note: our API routes edit using ID. Let's fetch all posts first)
                const res = await fetch(`${API_BASE}/api/posts`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    const postToEdit = data.posts.find(p => p.id === parseInt(editId));

                    if (postToEdit) {
                        // Check permissions
                        if (user.role === "USER" && postToEdit.author_id !== user.id) {
                            alert("Forbidden. You can only edit your own posts.");
                            navigate("/");
                            return;
                        }

                        setTitle(postToEdit.title);
                        setContent(postToEdit.content);
                        
                        const predefined = ["Tech", "Writing", "Design", "Development", "React", "Database", "Life", "JavaScript", "Node", "CSS"];
                        if (postToEdit.category && !predefined.includes(postToEdit.category)) {
                            setCategory("custom");
                            setShowCustomCategoryInput(true);
                            setCustomCategory(postToEdit.category);
                        } else {
                            setCategory(postToEdit.category || "Tech");
                            setShowCustomCategoryInput(false);
                        }

                        if (postToEdit.image) {
                            setImagePreview(`${API_BASE}/${postToEdit.image}`);
                        }
                    } else {
                        alert("Post not found.");
                        navigate("/");
                    }
                }
            } catch (err) {
                console.error("Error loading post to edit:", err);
            } finally {
                setLoading(false);
            }
        };

        loadPostToEdit();
    }, [editId, token, user, navigate]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setImage(null);
        setImagePreview(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !content.trim() || isSubmitting) return;

        setIsSubmitting(true);
        
        const categoryToSubmit = category === "custom" ? customCategory.trim() : category;
        if (category === "custom" && !customCategory.trim()) {
            alert("Please enter a custom category name.");
            setIsSubmitting(false);
            return;
        }

        const formData = new FormData();
        formData.append("title", title);
        formData.append("content", content);
        formData.append("category", categoryToSubmit);
        if (image) {
            formData.append("image", image);
        }

        try {
            let url = `${API_BASE}/api/posts`;
            let method = "POST";

            if (editId) {
                url = `${API_BASE}/api/posts/${editId}`;
                method = "PUT"; // Use PUT for edit
            }

            const res = await fetch(url, {
                method: method,
                headers: {
                    Authorization: `Bearer ${token}`
                    // Do NOT set Content-Type header when sending FormData!
                },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                navigate(`/posts/${data.post.slug}`);
            } else {
                const errorData = await res.json();
                alert(errorData.error || "Something went wrong.");
            }
        } catch (err) {
            console.error("Submit error:", err);
            alert("Network error. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center py-20">
                <p className="text-neutral-500 font-semibold animate-pulse">Loading story data...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-8 py-10">
            {/* Header Toolbar */}
            <div className="flex items-center justify-between pb-6 border-b border-neutral-100 mb-8">
                <button 
                    onClick={() => navigate(-1)} 
                    className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors uppercase tracking-wider"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Cancel</span>
                </button>

                <button
                    onClick={handleSubmit}
                    disabled={!title.trim() || !content.trim() || isSubmitting}
                    className="px-5 py-2 rounded-full text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                    {isSubmitting ? "Publishing..." : editId ? "Update Story" : "Publish Story"}
                </button>
            </div>

            {/* Editor Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Image Uploader */}
                <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                        imagePreview 
                            ? "border-neutral-100 bg-neutral-50" 
                            : dragOver 
                            ? "border-neutral-400 bg-neutral-50" 
                            : "border-neutral-200 hover:border-neutral-300"
                    }`}
                >
                    {imagePreview ? (
                        <div className="relative w-full h-48 md:h-64 rounded-lg overflow-hidden group">
                            <img 
                                src={imagePreview} 
                                alt="Cover preview" 
                                className="w-full h-full object-cover" 
                            />
                            <button
                                type="button"
                                onClick={removeImage}
                                className="absolute top-3 right-3 p-2 bg-neutral-900/80 hover:bg-neutral-900 text-white rounded-full transition-colors"
                                title="Remove Image"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-6 select-none cursor-pointer">
                            <ImageIcon className="w-10 h-10 text-neutral-300 mb-3" />
                            <h4 className="text-sm font-bold text-neutral-800 mb-1">Upload a cover image</h4>
                            <p className="text-xs text-neutral-400 mb-4 max-w-xs">Drag and drop your image here, or browse local files.</p>
                            
                            <label className="px-4 py-1.5 rounded-full text-xs font-semibold text-neutral-700 border border-neutral-200 bg-white hover:bg-neutral-50 cursor-pointer transition-colors shadow-sm">
                                <span>Browse files</span>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleImageChange} 
                                    className="hidden" 
                                />
                            </label>
                        </div>
                    )}
                </div>

                {/* Category Selection Dropdown */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-neutral-500 bg-neutral-50 px-4 py-2 rounded-xl w-max border border-neutral-100">
                        <span className="font-semibold uppercase text-xs tracking-wider">Category:</span>
                        <select
                            value={category}
                            onChange={(e) => {
                                if (e.target.value === "custom") {
                                    setShowCustomCategoryInput(true);
                                    setCategory("custom");
                                } else {
                                    setShowCustomCategoryInput(false);
                                    setCategory(e.target.value);
                                }
                            }}
                            className="bg-transparent border-none text-xs font-bold text-neutral-800 focus:ring-0 p-0 outline-none cursor-pointer uppercase tracking-wider"
                        >
                            <option value="Tech">Tech</option>
                            <option value="Writing">Writing</option>
                            <option value="Design">Design</option>
                            <option value="Development">Development</option>
                            <option value="React">React</option>
                            <option value="Database">Database</option>
                            <option value="Life">Life</option>
                            <option value="JavaScript">JavaScript</option>
                            <option value="Node">Node</option>
                            <option value="CSS">CSS</option>
                            <option value="custom">+ Custom...</option>
                        </select>
                    </div>

                    {showCustomCategoryInput && (
                        <input
                            type="text"
                            placeholder="Enter custom category..."
                            value={customCategory}
                            onChange={(e) => setCustomCategory(e.target.value)}
                            className="text-xs font-bold text-neutral-800 bg-neutral-50 border border-neutral-100 px-4 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-all uppercase tracking-wider w-full sm:w-48"
                            required
                        />
                    )}
                </div>

                {/* Post Title */}
                <div>
                    <input
                        type="text"
                        placeholder="Title of your story..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full text-2xl md:text-3xl font-bold font-serif border-none focus:ring-0 p-0 text-neutral-900 placeholder-neutral-300 outline-none"
                        required
                    />
                </div>

                {/* Divider */}
                <hr className="border-neutral-100" />

                {/* Post Content */}
                <div>
                    <textarea
                        placeholder="Tell your story. Explain the code, outline the vibe, share your journey..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows="12"
                        className="w-full text-base md:text-lg font-serif border-none focus:ring-0 p-0 text-neutral-850 placeholder-neutral-300 resize-none outline-none leading-relaxed"
                        required
                    />
                </div>

            </form>
        </div>
    );
};

export default WritePost;
