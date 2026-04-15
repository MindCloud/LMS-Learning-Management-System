// src/pages/ManageResourceFolders.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    collection,
    query,
    where,
    getDocs,
    deleteDoc,
    doc,
    updateDoc,
    getDoc
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "sonner";
import {
    ArrowLeft, Edit2, Trash2, BookOpen, Award,
    FileText, Download, Zap, Target, ExternalLink,
    Loader2
} from "lucide-react";
import AddResourceFolderModal from "../components/AddResourceFolderModal";

const iconMap = {
    BookOpen: BookOpen,
    Award: Award,
    FileText: FileText,
    Download: Download,
    Zap: Zap,
    Target: Target,
};

const ManageResourceFolders = () => {
    const [teacher, setTeacher] = useState(null);
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingFolder, setEditingFolder] = useState(null);
    const navigate = useNavigate();

    // Fetch teacher profile
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const docRef = doc(db, "teachers", user.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setTeacher({ uid: user.uid, ...docSnap.data() });
                    } else {
                        toast.error("Teacher profile not found");
                        navigate("/login");
                    }
                } catch (err) {
                    console.error("Error loading teacher profile:", err);
                    toast.error("Failed to load profile");
                    navigate("/login");
                }
            } else {
                navigate("/login");
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    // Fetch teacher's resource folders
    const fetchFolders = async () => {
        if (!teacher?.uid) return;

        setLoading(true);
        try {
            const q = query(
                collection(db, "resourceFolders"),
                where("teacherId", "==", teacher.uid)
            );
            const snapshot = await getDocs(q);

            const fetchedFolders = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).sort((a, b) => new Date(b.createdAt?.toDate?.() || 0) - new Date(a.createdAt?.toDate?.() || 0));

            setFolders(fetchedFolders);
        } catch (error) {
            console.error("Error fetching folders:", error);
            toast.error("Failed to load resource folders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFolders();
    }, [teacher]);

    const handleDelete = async (folderId, folderName) => {
        if (!window.confirm(`Delete "${folderName}"? This action cannot be undone.`)) return;

        try {
            await deleteDoc(doc(db, "resourceFolders", folderId));
            setFolders(prev => prev.filter(f => f.id !== folderId));
            toast.success("Folder deleted successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete folder");
        }
    };

    const handleEdit = (folder) => {
        setEditingFolder(folder);
        setIsAddModalOpen(true);
    };

    const handleModalClose = () => {
        setIsAddModalOpen(false);
        setEditingFolder(null);
        fetchFolders(); // Refresh list after add or update
    };

    const getIcon = (iconName) => {
        return iconMap[iconName] || BookOpen;
    };

    if (!teacher) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-slate-50 to-white flex items-center justify-center p-6">
                <div className="flex items-center gap-3 text-slate-600 rounded-xl bg-white/80 px-4 py-3 ring-1 ring-blue-100">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <p>Loading teacher profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-slate-50 to-white">
            {/* Header */}
            <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
                <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-slate-100 rounded-xl transition"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">Manage Resource Folders</h1>
                            <p className="text-slate-500">Add, edit or delete resources visible in Downloads page</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-2xl font-medium hover:from-blue-700 hover:to-indigo-700 transition shadow-sm"
                    >
                        <BookOpen className="w-5 h-5" />
                        Add New Folder
                    </button>
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-6 py-8">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="flex items-center gap-3 text-slate-500">
                            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            Loading your resources...
                        </div>
                    </div>
                ) : folders.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border">
                        <BookOpen className="mx-auto w-16 h-16 text-slate-300 mb-4" />
                        <h3 className="text-xl font-medium text-slate-700">No resource folders yet</h3>
                        <p className="text-slate-500 mt-2">Click "Add New Folder" to get started</p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {folders.map((folder) => {
                            const IconComponent = getIcon(folder.iconName);
                            return (
                                <div
                                    key={folder.id}
                                    className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition group"
                                >
                                    <div className={`h-2 bg-gradient-to-r ${folder.accent || "from-blue-600 to-indigo-600"}`} />

                                    <div className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                                                <IconComponent className="w-8 h-8 text-slate-700" />
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                                <button
                                                    onClick={() => handleEdit(folder)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(folder.id, folder.name)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <h3 className="font-semibold text-lg mt-5 line-clamp-2">{folder.name}</h3>
                                        <p className="text-slate-600 text-sm mt-2 line-clamp-3">{folder.description}</p>

                                        <div className="mt-6 pt-6 border-t flex items-center justify-between text-sm">
                                            <div>
                                                <span className="font-medium">{folder.files || 0}</span>
                                                <span className="text-slate-500"> files</span>
                                            </div>
                                            <div className="text-slate-500">{folder.updated}</div>
                                        </div>

                                        <div className="mt-4">
                                            <a
                                                href={folder.driveLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                                            >
                                                Open in Drive <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </div>
                                    </div>

                                    <div className="px-6 py-4 bg-slate-50 border-t flex items-center justify-between text-xs">
                                        <span className="text-slate-500">Category:</span>
                                        <span className="font-medium text-slate-700">{folder.category}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Add / Edit Modal */}
            <AddResourceFolderModal
                isOpen={isAddModalOpen}
                onClose={handleModalClose}
                teacher={teacher}
                initialData={editingFolder}   // Pass data when editing
            />
        </div>
    );
};

export default ManageResourceFolders;