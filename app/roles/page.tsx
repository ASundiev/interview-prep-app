"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    ChevronRight,
    Trash2,
    Clock,
    Target,
    Award,
    FileText,
    Briefcase,
    Edit3,
    Play,
    Building2,
    ArrowLeft,
} from "lucide-react";
import {
    getAllRoles,
    deleteRole,
    setActiveRoleId,
    setActiveSessionId,
    setActiveStageId,
    migrateFromSeries,
} from "@/utils/profileStorage";
import { Role, STORAGE_KEYS } from "@/types/profile";

export default function RolesPage() {
    const router = useRouter();
    const [roles, setRoles] = useState<Role[]>([]);
    const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);

    useEffect(() => {
        // Migrate old series data if present
        migrateFromSeries();
        setRoles(getAllRoles());
    }, []);

    const handleNewRole = () => {
        router.push("/roles/new");
    };

    const handleEditRole = (roleId: string) => {
        router.push(`/roles/${roleId}/edit`);
    };

    const handleStartInterview = (roleId: string, stageId: string) => {
        const role = roles.find((r) => r.roleId === roleId);
        if (!role) return;

        const stage = role.stages.find((s) => s.id === stageId);
        if (!stage) return;

        setActiveRoleId(roleId);
        setActiveStageId(stageId);
        setActiveSessionId(`${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

        router.push("/interview");
    };

    const handleDeleteRole = (roleId: string) => {
        if (confirm("Are you sure you want to delete this role and all its sessions?")) {
            deleteRole(roleId);
            setRoles(getAllRoles());
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const getAverageScore = (role: Role): number | null => {
        const sessionsWithScore = role.sessions.filter((s) => s.analysis?.overallScore);
        if (sessionsWithScore.length === 0) return null;
        const total = sessionsWithScore.reduce(
            (sum, s) => sum + (s.analysis?.overallScore || 0),
            0
        );
        return Math.round(total / sessionsWithScore.length);
    };

    return (
        <main className="min-h-screen bg-dark-950 text-white p-4 md:p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => router.push("/")}
                            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-400" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold">My Roles</h1>
                            <p className="text-sm text-gray-400 mt-0.5">
                                Manage your interview preparation for each opportunity
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleNewRole}
                        className="btn-primary flex items-center space-x-2 px-5 py-2.5"
                    >
                        <Plus className="w-5 h-5" />
                        <span>New Role</span>
                    </button>
                </header>

                {/* Roles List */}
                {roles.length === 0 ? (
                    <div className="glass-panel p-12 rounded-3xl text-center">
                        <div className="w-16 h-16 bg-dark-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Briefcase className="w-8 h-8 text-gray-500" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">No roles yet</h2>
                        <p className="text-gray-400 mb-6 max-w-md mx-auto">
                            Create your first role to start preparing for interviews. Upload the job
                            description and any context to personalize your practice sessions.
                        </p>
                        <button
                            onClick={handleNewRole}
                            className="btn-primary inline-flex items-center space-x-2 px-6 py-3"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Create Your First Role</span>
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {roles.map((role) => {
                            const isExpanded = expandedRoleId === role.roleId;
                            const avgScore = getAverageScore(role);

                            return (
                                <div
                                    key={role.roleId}
                                    className="glass-panel rounded-2xl overflow-hidden"
                                >
                                    {/* Role Header */}
                                    <div
                                        className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                                        onClick={() =>
                                            setExpandedRoleId(isExpanded ? null : role.roleId)
                                        }
                                    >
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                                                <Building2 className="w-6 h-6 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg">{role.roleName}</h3>
                                                <div className="flex items-center space-x-3 text-sm text-gray-400 mt-0.5">
                                                    {role.companyName && (
                                                        <>
                                                            <span>{role.companyName}</span>
                                                            <span>•</span>
                                                        </>
                                                    )}
                                                    <span className="flex items-center space-x-1">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span>{formatDate(role.createdAt)}</span>
                                                    </span>
                                                    <span>•</span>
                                                    <span>{role.sessions.length} session(s)</span>
                                                    {avgScore && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="flex items-center space-x-1 text-primary">
                                                                <Award className="w-3.5 h-3.5" />
                                                                <span>Avg: {avgScore}%</span>
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditRole(role.roleId);
                                                }}
                                                className="p-2 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                                            >
                                                <Edit3 className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteRole(role.roleId);
                                                }}
                                                className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                            <ChevronRight
                                                className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? "rotate-90" : ""
                                                    }`}
                                            />
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    {isExpanded && (
                                        <div className="border-t border-white/5 p-5 bg-dark-900/50 space-y-6">
                                            {/* Role Info */}
                                            {(role.roleTitle || role.jdFileName) && (
                                                <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                                                    {role.roleTitle && (
                                                        <span className="flex items-center space-x-1">
                                                            <Target className="w-4 h-4" />
                                                            <span>{role.roleTitle}</span>
                                                        </span>
                                                    )}
                                                    {role.jdFileName && (
                                                        <span className="flex items-center space-x-1">
                                                            <FileText className="w-4 h-4" />
                                                            <span>{role.jdFileName}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Interview Stages */}
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
                                                    Start Interview
                                                </h4>
                                                <div className="flex flex-wrap gap-3">
                                                    {role.stages.map((stage) => (
                                                        <button
                                                            key={stage.id}
                                                            onClick={() => handleStartInterview(role.roleId, stage.id)}
                                                            className="px-4 py-2.5 text-sm rounded-xl border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center space-x-2"
                                                        >
                                                            <Play className="w-4 h-4" />
                                                            <span>{stage.name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Past Sessions */}
                                            {role.sessions.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
                                                        Past Sessions
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {role.sessions.slice(-5).reverse().map((session, index) => (
                                                            <div
                                                                key={session.id}
                                                                className="flex items-center justify-between p-3 bg-dark-800/50 rounded-xl border border-white/5"
                                                            >
                                                                <div className="flex items-center space-x-3">
                                                                    <span className="w-6 h-6 rounded-full bg-dark-700 flex items-center justify-center text-xs font-medium text-gray-400">
                                                                        {role.sessions.length - index}
                                                                    </span>
                                                                    <span className="px-2 py-0.5 rounded text-xs font-medium border bg-white/5 border-white/10">
                                                                        {session.stageName}
                                                                    </span>
                                                                    <span className="text-sm text-gray-400">
                                                                        {formatDate(session.startedAt)}
                                                                    </span>
                                                                </div>
                                                                {session.analysis && (
                                                                    <span
                                                                        className={`text-sm font-medium ${session.analysis.overallScore >= 80
                                                                                ? "text-green-400"
                                                                                : session.analysis.overallScore >= 60
                                                                                    ? "text-yellow-400"
                                                                                    : "text-red-400"
                                                                            }`}
                                                                    >
                                                                        {session.analysis.overallScore}%
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between items-center pt-4">
                    <button
                        onClick={() => router.push("/")}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        ← Back to Home
                    </button>
                    <button
                        onClick={() => router.push("/profile")}
                        className="text-sm text-primary hover:text-primary-light transition-colors"
                    >
                        Edit Profile →
                    </button>
                </div>
            </div>
        </main>
    );
}
