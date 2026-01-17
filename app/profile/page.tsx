"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    User,
    Upload,
    FileText,
    Save,
    Loader2,
    CheckCircle2,
    X,
    Plus,
    ArrowLeft,
} from "lucide-react";
import {
    getUserProfile,
    createUserProfile,
    updateUserProfile,
} from "@/utils/profileStorage";
import { UserProfile } from "@/types/profile";

export default function ProfilePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Profile state
    const [name, setName] = useState("");
    const [background, setBackground] = useState("");
    const [strengths, setStrengths] = useState<string[]>([]);
    const [newStrength, setNewStrength] = useState("");
    const [preferences, setPreferences] = useState("");
    const [cvFileName, setCvFileName] = useState<string | null>(null);
    const [cvText, setCvText] = useState<string | null>(null);

    // Load existing profile
    useEffect(() => {
        const profile = getUserProfile();
        if (profile) {
            setName(profile.name);
            setBackground(profile.background);
            setStrengths(profile.strengths);
            setPreferences(profile.preferences);
            setCvFileName(profile.defaultCvFileName);
            setCvText(profile.defaultCvText);
        }
    }, []);

    const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;

        const file = e.target.files[0];
        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append("cv", file);

            const response = await fetch("/api/parse-cv", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to parse CV");
            }

            const data = await response.json();

            setName(data.name);
            setBackground(data.background);
            setStrengths(data.strengths);
            setCvText(data.cvText);
            setCvFileName(data.cvFileName);
        } catch (error) {
            console.error(error);
            alert("Failed to parse CV. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddStrength = () => {
        if (newStrength.trim()) {
            setStrengths([...strengths, newStrength.trim()]);
            setNewStrength("");
        }
    };

    const handleRemoveStrength = (index: number) => {
        setStrengths(strengths.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        setIsSaving(true);

        try {
            const existingProfile = getUserProfile();

            if (existingProfile) {
                updateUserProfile({
                    name,
                    background,
                    strengths,
                    preferences,
                    defaultCvText: cvText,
                    defaultCvFileName: cvFileName,
                });
            } else {
                createUserProfile(name, background, strengths, cvText, cvFileName);
                // Also update preferences separately
                updateUserProfile({ preferences });
            }

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        } catch (error) {
            console.error(error);
            alert("Failed to save profile.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <main className="min-h-screen bg-dark-950 text-white p-4 md:p-8 font-sans">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header */}
                <header className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => router.push("/")}
                            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-400" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold">Your Profile</h1>
                            <p className="text-sm text-gray-400 mt-0.5">
                                This info is used across all your interviews
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !name}
                        className="btn-primary flex items-center space-x-2 px-5 py-2.5 disabled:opacity-50"
                    >
                        {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : saveSuccess ? (
                            <CheckCircle2 className="w-4 h-4" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        <span>{saveSuccess ? "Saved!" : "Save Profile"}</span>
                    </button>
                </header>

                {/* CV Upload Section */}
                <section className="glass-panel p-6 rounded-2xl space-y-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-semibold">Default CV</h2>
                            <p className="text-sm text-gray-400">
                                Upload your CV to auto-populate your profile
                            </p>
                        </div>
                    </div>

                    <div className="relative">
                        <input
                            type="file"
                            accept=".pdf,.doc,.docx,.txt,.md"
                            onChange={handleCvUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={isLoading}
                        />
                        <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${cvFileName ? "border-primary/30 bg-primary/5" : "border-white/10 hover:border-white/20"
                            }`}>
                            {isLoading ? (
                                <div className="flex flex-col items-center space-y-2">
                                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                    <span className="text-sm text-gray-400">Parsing CV...</span>
                                </div>
                            ) : cvFileName ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <CheckCircle2 className="w-5 h-5 text-primary" />
                                    <span className="text-sm">{cvFileName}</span>
                                    <span className="text-xs text-gray-500">• Click to replace</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center space-y-2">
                                    <Upload className="w-8 h-8 text-gray-500" />
                                    <span className="text-sm text-gray-400">
                                        Drop your CV here or click to upload
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        PDF, DOCX, TXT, or Markdown
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Personal Info Section */}
                <section className="glass-panel p-6 rounded-2xl space-y-6">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <User className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="font-semibold">Personal Info</h2>
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Your Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            className="w-full bg-dark-900/70 border border-dark-700 rounded-xl px-4 py-3 text-sm focus:border-primary/60 focus:ring-0 transition-all"
                        />
                    </div>

                    {/* Background */}
                    <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Professional Background
                        </label>
                        <textarea
                            value={background}
                            onChange={(e) => setBackground(e.target.value)}
                            placeholder="A brief summary of your experience, seniority, and domain expertise..."
                            rows={3}
                            className="w-full bg-dark-900/70 border border-dark-700 rounded-xl px-4 py-3 text-sm focus:border-primary/60 focus:ring-0 transition-all resize-none"
                        />
                        <p className="text-xs text-gray-500">
                            This helps the AI understand your experience level and expertise.
                        </p>
                    </div>

                    {/* Strengths */}
                    <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Key Strengths
                        </label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {strengths.map((strength, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm"
                                >
                                    <span>{strength}</span>
                                    <button
                                        onClick={() => handleRemoveStrength(index)}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={newStrength}
                                onChange={(e) => setNewStrength(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAddStrength()}
                                placeholder="Add a strength..."
                                className="flex-1 bg-dark-900/70 border border-dark-700 rounded-xl px-4 py-2.5 text-sm focus:border-primary/60 focus:ring-0 transition-all"
                            />
                            <button
                                onClick={handleAddStrength}
                                disabled={!newStrength.trim()}
                                className="px-4 py-2.5 rounded-xl bg-dark-800 border border-white/10 hover:bg-dark-700 disabled:opacity-50 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Preferences */}
                    <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Interview Preferences (Optional)
                        </label>
                        <textarea
                            value={preferences}
                            onChange={(e) => setPreferences(e.target.value)}
                            placeholder="Any preferences for how you'd like the AI to conduct interviews..."
                            rows={2}
                            className="w-full bg-dark-900/70 border border-dark-700 rounded-xl px-4 py-3 text-sm focus:border-primary/60 focus:ring-0 transition-all resize-none"
                        />
                        <p className="text-xs text-gray-500">
                            E.g., "I prefer direct feedback" or "Focus on behavioral questions"
                        </p>
                    </div>
                </section>

                {/* Navigation */}
                <div className="flex justify-between items-center pt-4">
                    <button
                        onClick={() => router.push("/")}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        ← Back to Home
                    </button>
                    <button
                        onClick={() => router.push("/roles")}
                        className="text-sm text-primary hover:text-primary-light transition-colors"
                    >
                        Manage Roles →
                    </button>
                </div>
            </div>
        </main>
    );
}
