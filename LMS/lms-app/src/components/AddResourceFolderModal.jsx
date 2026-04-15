// src/components/AddResourceFolderModal.jsx
import React, { useState } from "react";
import { addDoc, collection, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "sonner";
import {
    X, Upload, Calendar, Link as LinkIcon,
    BookOpen, Award, FileText, Download,
    Zap, Target
} from "lucide-react";

const iconOptions = [
    { name: "BookOpen", component: BookOpen, label: "Book" },
    { name: "Award", component: Award, label: "Award" },
    { name: "FileText", component: FileText, label: "Notes" },
    { name: "Download", component: Download, label: "Download" },
    { name: "Zap", component: Zap, label: "Lightning" },
    { name: "Target", component: Target, label: "Target" },
];

const accentOptions = [
    { value: "from-blue-600 to-indigo-600", label: "Blue", color: "bg-gradient-to-r from-blue-600 to-indigo-600" },
    { value: "from-indigo-500 to-violet-600", label: "Indigo", color: "bg-gradient-to-r from-indigo-500 to-violet-600" },
    { value: "from-emerald-500 to-teal-600", label: "Emerald", color: "bg-gradient-to-r from-emerald-500 to-teal-600" },
    { value: "from-amber-500 to-orange-600", label: "Amber", color: "bg-gradient-to-r from-amber-500 to-orange-600" },
    { value: "from-rose-500 to-pink-600", label: "Rose", color: "bg-gradient-to-r from-rose-500 to-pink-600" },
    { value: "from-purple-600 to-fuchsia-600", label: "Purple", color: "bg-gradient-to-r from-purple-600 to-fuchsia-600" },
];

const AddResourceFolderModal = ({ isOpen, onClose, teacher, initialData }) => {
    const [formData, setFormData] = useState({
        name: initialData?.name || "",
        description: initialData?.description || "",
        category: initialData?.category || "Past Papers",
        filesCount: initialData?.files || "",
        updated: initialData?.updated || "",
        driveLink: initialData?.driveLink || "",
        accent: initialData?.accent || "from-blue-600 to-indigo-600",
        iconName: initialData?.iconName || "BookOpen",
    });

    const [loading, setLoading] = useState(false);
    const [selectedIcon, setSelectedIcon] = useState(initialData?.iconName || "BookOpen");

    // Update form data when initialData changes (e.g. when opening modal for a new edit)
    React.useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || "",
                description: initialData.description || "",
                category: initialData.category || "Past Papers",
                filesCount: initialData.files || "",
                updated: initialData.updated || "",
                driveLink: initialData.driveLink || "",
                accent: initialData.accent || "from-blue-600 to-indigo-600",
                iconName: initialData.iconName || "BookOpen",
            });
            setSelectedIcon(initialData.iconName || "BookOpen");
        } else {
            setFormData({
                name: "", description: "", category: "Past Papers",
                filesCount: "", updated: "", driveLink: "",
                accent: "from-blue-600 to-indigo-600", iconName: "BookOpen"
            });
            setSelectedIcon("BookOpen");
        }
    }, [initialData, isOpen]);

    const categories = [
        "Past Papers", "Marking Schemes", "Model Papers",
        "Notes", "Revision", "Quick Guides"
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleIconSelect = (iconName) => {
        setSelectedIcon(iconName);
        setFormData(prev => ({ ...prev, iconName }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.description || !formData.driveLink) {
            toast.error("Please fill all required fields");
            return;
        }

        setLoading(true);

        try {
            const folderData = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                category: formData.category,
                files: parseInt(formData.filesCount) || 0,
                updated: formData.updated.trim(),
                driveLink: formData.driveLink.trim(),
                accent: formData.accent,
                iconName: formData.iconName,
                teacherId: teacher.uid,
                teacherName: teacher.fullName || teacher.name || "Teacher",
                updatedAt: serverTimestamp(),
            };

            if (initialData) {
                // Update existing folder
                await updateDoc(doc(db, "resourceFolders", initialData.id), folderData);
                toast.success("Resource folder updated successfully!");
            } else {
                // Add new folder
                await addDoc(collection(db, "resourceFolders"), {
                    ...folderData,
                    createdAt: serverTimestamp(),
                });
                toast.success("Resource folder added successfully!");
            }

            onClose();

            // Reset form
            setFormData({
                name: "", description: "", category: "Past Papers",
                filesCount: "", updated: "", driveLink: "",
                accent: "from-blue-600 to-indigo-600", iconName: "BookOpen"
            });
            setSelectedIcon("BookOpen");
        } catch (error) {
            console.error(error);
            toast.error("Failed to add folder. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

                {/* Header */}
                <div className="px-6 py-5 border-b flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-blue-100 rounded-2xl flex items-center justify-center">
                            <Upload className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-semibold text-slate-900">{initialData ? "Edit Folder" : "Add New Folder"}</h2>
                            <p className="text-sm text-slate-500">{initialData ? "Update resource details" : "Share resources with students"}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[85vh]">

                    {/* Folder Name */}
                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                            Folder Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="2024 A/L Combined Maths Past Papers"
                            className="w-full px-4 py-3.5 border border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-base"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows={3}
                            placeholder="Combined Maths • Physics • Chemistry • Biology • ICT with answers and explanations"
                            className="w-full px-4 py-3.5 border border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-y min-h-[90px]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        {/* Category */}
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Category</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-4 py-3.5 border border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Number of Files */}
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Number of Files</label>
                            <input
                                type="number"
                                name="filesCount"
                                value={formData.filesCount}
                                onChange={handleChange}
                                placeholder="56"
                                className="w-full px-4 py-3.5 border border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                    </div>

                    {/* Updated Date & Drive Link */}
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Last Updated
                            </label>
                            <input
                                type="text"
                                name="updated"
                                value={formData.updated}
                                onChange={handleChange}
                                placeholder="April 2025"
                                className="w-full px-4 py-3.5 border border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block flex items-center gap-2">
                                <LinkIcon className="w-4 h-4" /> Google Drive Link <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="url"
                                name="driveLink"
                                value={formData.driveLink}
                                onChange={handleChange}
                                required
                                placeholder="https://drive.google.com/drive/folders/..."
                                className="w-full px-4 py-3.5 border border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                    </div>

                    {/* Icon Selection */}
                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-3 block">Select Icon</label>
                        <div className="grid grid-cols-6 gap-3">
                            {iconOptions.map((icon) => {
                                const IconComponent = icon.component;
                                const isSelected = selectedIcon === icon.name;
                                return (
                                    <button
                                        key={icon.name}
                                        type="button"
                                        onClick={() => handleIconSelect(icon.name)}
                                        className={`aspect-square flex items-center justify-center rounded-2xl border-2 transition-all hover:scale-105 ${isSelected
                                                ? "border-blue-600 bg-blue-50 shadow-sm"
                                                : "border-slate-200 hover:border-slate-300"
                                            }`}
                                    >
                                        <IconComponent className={`w-7 h-7 ${isSelected ? "text-blue-600" : "text-slate-600"}`} />
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Choose an icon that best represents this folder</p>
                    </div>

                    {/* Accent Color */}
                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-3 block">Accent Color</label>
                        <div className="flex flex-wrap gap-3">
                            {accentOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, accent: option.value }))}
                                    className={`w-10 h-10 rounded-2xl border-4 transition-all hover:scale-110 ${formData.accent === option.value
                                            ? "border-slate-900 shadow-md"
                                            : "border-transparent"
                                        } ${option.color}`}
                                    title={option.label}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons - Always Visible */}
                    <div className="flex gap-3 pt-6 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 rounded-2xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-100 transition"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>Saving...</>
                            ) : (
                                <>
                                    <Upload className="w-5 h-5" />
                                    {initialData ? "Update Folder" : "Add Resource Folder"}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddResourceFolderModal;