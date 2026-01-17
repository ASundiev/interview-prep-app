"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Save,
    Loader2,
    Upload,
    FileText,
    CheckCircle2,
    Plus,
    X,
    GripVertical,
    Building2,
} from "lucide-react";
import { createRole } from "@/utils/profileStorage";
import { InterviewStage, DEFAULT_INTERVIEW_STAGES } from "@/types/profile";

export default function NewRolePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isParsingJd, setIsParsingJd] = useState(false);
    const [isParsingRecruiter, setIsParsingRecruiter] = useState(false);

    // Role info
    const [roleName, setRoleName] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [roleTitle, setRoleTitle] = useState("");
    const [extraContext, setExtraContext] = useState("");

    // Files
    const [jdText, setJdText] = useState<string | null>(null);
    const [jdFileName, setJdFileName] = useState<string | null>(null);
    const [recruiterText, setRecruiterText] = useState<string | null>(null);
    const [recruiterFileName, setRecruiterFileName] = useState<string | null>(null);

    // Stages
    const [stages, setStages] = useState<InterviewStage[]>([...DEFAULT_INTERVIEW_STAGES]);
    const [newStageName, setNewStageName] = useState("");
    const [newStageDescription, setNewStageDescription] = useState("");

    const handleJdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];
        setIsParsingJd(true);

        try {
            const formData = new FormData();
            formData.append("jd", file);

            const response = await fetch("/api/parse-jd", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to parse job description");
            }

            const data = await response.json();

            // Auto-populate role details from parsed JD
            if (data.roleName && !roleName) setRoleName(data.roleName);
            if (data.companyName && !companyName) setCompanyName(data.companyName);
            if (data.roleTitle && !roleTitle) setRoleTitle(data.roleTitle);

            setJdText(data.jdText);
            setJdFileName(data.jdFileName);
        } catch (error) {
            console.error(error);
            // Fallback: just read the text
            try {
                const text = await file.text();
                setJdText(text);
                setJdFileName(file.name);
            } catch (fallbackError) {
                alert("Failed to read file");
            }
        } finally {
            setIsParsingJd(false);
        }
    };

    const handleRecruiterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];
        setIsParsingRecruiter(true);

        try {
            const text = await file.text();
            setRecruiterText(text);
            setRecruiterFileName(file.name);
        } catch (error) {
            console.error(error);
            alert("Failed to read file");
        } finally {
            setIsParsingRecruiter(false);
        }
    };

    const handleAddStage = () => {
        if (!newStageName.trim()) return;

        const newStage: InterviewStage = {
            id: `stage-${Date.now()}`,
            name: newStageName.trim(),
            description: newStageDescription.trim() || `${newStageName.trim()} interview stage.`,
        };

        setStages([...stages, newStage]);
        setNewStageName("");
        setNewStageDescription("");
    };

    const handleRemoveStage = (stageId: string) => {
        if (stages.length <= 1) {
            alert("You need at least one interview stage.");
            return;
        }
        setStages(stages.filter((s) => s.id !== stageId));
    };

    const handleSave = async () => {
        if (!roleName.trim()) {
            alert("Please enter a role name.");
            return;
        }

        setIsLoading(true);

        try {
            createRole(
                roleName.trim(),
                companyName.trim(),
                roleTitle.trim(),
                jdText,
                jdFileName,
                recruiterText,
                recruiterFileName,
                extraContext.trim() || null,
                stages
            );

            router.push("/roles");
        } catch (error) {
            console.error(error);
            alert("Failed to create role.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-dark-950 text-white p-4 md:p-8 font-sans">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header */}
                <header className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => router.push("/roles")}
                            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-400" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold">New Role</h1>
                            <p className="text-sm text-gray-400 mt-0.5">
                                Add context for your interview preparation
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isLoading || !roleName.trim()}
                        className="btn-primary flex items-center space-x-2 px-5 py-2.5 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        <span>Create Role</span>
                    </button>
                </header>

                {/* Basic Info */}
                <section className="glass-panel p-6 rounded-2xl space-y-6">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="font-semibold">Role Details</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Role Name *
                            </label>
                            <input
                                type="text"
                                value={roleName}
                                onChange={(e) => setRoleName(e.target.value)}
                                placeholder="e.g., Wise - Senior Designer"
                                className="w-full bg-dark-900/70 border border-dark-700 rounded-xl px-4 py-3 text-sm focus:border-primary/60 focus:ring-0 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Company Name
                            </label>
                            <input
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="e.g., Wise"
                                className="w-full bg-dark-900/70 border border-dark-700 rounded-xl px-4 py-3 text-sm focus:border-primary/60 focus:ring-0 transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Role Title
                        </label>
                        <input
                            type="text"
                            value={roleTitle}
                            onChange={(e) => setRoleTitle(e.target.value)}
                            placeholder="e.g., Senior Product Designer"
                            className="w-full bg-dark-900/70 border border-dark-700 rounded-xl px-4 py-3 text-sm focus:border-primary/60 focus:ring-0 transition-all"
                        />
                    </div>
                </section>

                {/* Documents */}
                <section className="glass-panel p-6 rounded-2xl space-y-6">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="font-semibold">Documents</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* JD Upload */}
                        <div className="space-y-2">
                            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Job Description
                            </label>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.txt,.md"
                                    onChange={handleJdUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    disabled={isParsingJd}
                                />
                                <div
                                    className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${jdFileName
                                        ? "border-primary/30 bg-primary/5"
                                        : "border-white/10 hover:border-white/20"
                                        }`}
                                >
                                    {isParsingJd ? (
                                        <Loader2 className="w-5 h-5 text-primary animate-spin mx-auto" />
                                    ) : jdFileName ? (
                                        <div className="flex items-center justify-center space-x-2">
                                            <CheckCircle2 className="w-4 h-4 text-primary" />
                                            <span className="text-xs truncate">{jdFileName}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center space-x-2">
                                            <Upload className="w-4 h-4 text-gray-500" />
                                            <span className="text-xs text-gray-400">Upload JD</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Recruiter Upload */}
                        <div className="space-y-2">
                            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Recruiter Profile
                            </label>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.txt,.md"
                                    onChange={handleRecruiterUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    disabled={isParsingRecruiter}
                                />
                                <div
                                    className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${recruiterFileName
                                        ? "border-primary/30 bg-primary/5"
                                        : "border-white/10 hover:border-white/20"
                                        }`}
                                >
                                    {isParsingRecruiter ? (
                                        <Loader2 className="w-5 h-5 text-primary animate-spin mx-auto" />
                                    ) : recruiterFileName ? (
                                        <div className="flex items-center justify-center space-x-2">
                                            <CheckCircle2 className="w-4 h-4 text-primary" />
                                            <span className="text-xs truncate">{recruiterFileName}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center space-x-2">
                                            <Upload className="w-4 h-4 text-gray-500" />
                                            <span className="text-xs text-gray-400">Upload Profile</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Extra Context */}
                    <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Extra Context / Notes
                        </label>
                        <textarea
                            value={extraContext}
                            onChange={(e) => setExtraContext(e.target.value)}
                            placeholder="Any additional context, previous feedback, or specific areas to focus on..."
                            rows={3}
                            className="w-full bg-dark-900/70 border border-dark-700 rounded-xl px-4 py-3 text-sm focus:border-primary/60 focus:ring-0 transition-all resize-none"
                        />
                    </div>
                </section>

                {/* Interview Stages */}
                <section className="glass-panel p-6 rounded-2xl space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <GripVertical className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="font-semibold">Interview Stages</h2>
                                <p className="text-xs text-gray-400">Customize the stages for this role</p>
                            </div>
                        </div>
                    </div>

                    {/* Existing Stages */}
                    <div className="space-y-2">
                        {stages.map((stage, index) => (
                            <div
                                key={stage.id}
                                className="flex items-center justify-between p-3 bg-dark-800/50 rounded-xl border border-white/5"
                            >
                                <div className="flex items-center space-x-3">
                                    <span className="w-6 h-6 rounded-full bg-dark-700 flex items-center justify-center text-xs font-medium text-gray-400">
                                        {index + 1}
                                    </span>
                                    <div>
                                        <span className="font-medium text-sm">{stage.name}</span>
                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                            {stage.description}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemoveStage(stage.id)}
                                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Add New Stage */}
                    <div className="border-t border-white/5 pt-4 space-y-3">
                        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Add Custom Stage
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="text"
                                value={newStageName}
                                onChange={(e) => setNewStageName(e.target.value)}
                                placeholder="Stage name (e.g., Technical Screen)"
                                className="flex-1 bg-dark-900/70 border border-dark-700 rounded-xl px-4 py-2.5 text-sm focus:border-primary/60 focus:ring-0 transition-all"
                            />
                            <button
                                onClick={handleAddStage}
                                disabled={!newStageName.trim()}
                                className="px-4 py-2.5 rounded-xl bg-dark-800 border border-white/10 hover:bg-dark-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add</span>
                            </button>
                        </div>
                        <input
                            type="text"
                            value={newStageDescription}
                            onChange={(e) => setNewStageDescription(e.target.value)}
                            placeholder="Brief description (optional)"
                            className="w-full bg-dark-900/70 border border-dark-700 rounded-xl px-4 py-2.5 text-sm focus:border-primary/60 focus:ring-0 transition-all"
                        />
                    </div>
                </section>

                {/* Navigation */}
                <div className="flex justify-between items-center pt-4">
                    <button
                        onClick={() => router.push("/roles")}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        ← Cancel
                    </button>
                </div>
            </div>
        </main>
    );
}
