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
} from "lucide-react";
import {
    getAllSeries,
    deleteSeries,
    setActiveSeriesId,
    setActiveSessionId,
} from "@/utils/seriesStorage";
import { SeriesHistory, STORAGE_KEYS } from "@/types/series";

const INTERVIEW_TYPE_LABELS = {
    screening: "Screening",
    "hiring-manager": "Hiring Manager",
    "cultural-fit": "Cultural Fit",
};

const INTERVIEW_TYPE_COLORS = {
    screening: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "hiring-manager": "bg-purple-500/10 text-purple-400 border-purple-500/20",
    "cultural-fit": "bg-green-500/10 text-green-400 border-green-500/20",
};

export default function SeriesPage() {
    const router = useRouter();
    const [seriesList, setSeriesList] = useState<SeriesHistory[]>([]);
    const [expandedSeriesId, setExpandedSeriesId] = useState<string | null>(null);

    useEffect(() => {
        setSeriesList(getAllSeries());
    }, []);

    const handleNewSeries = () => {
        // Clear any active series and go to home page to start fresh
        setActiveSeriesId(null);
        setActiveSessionId(null);
        localStorage.removeItem(STORAGE_KEYS.INTERVIEW_CONTEXT);
        localStorage.removeItem(STORAGE_KEYS.INTERVIEW_TRANSCRIPT);
        router.push("/?newSeries=true");
    };

    const handleContinueSeries = (
        seriesId: string,
        interviewType: "screening" | "hiring-manager" | "cultural-fit"
    ) => {
        const series = seriesList.find((s) => s.seriesId === seriesId);
        if (!series) return;

        // Set active series
        setActiveSeriesId(seriesId);

        // Prepare context with the selected interview type
        const context = {
            ...series.baseContext,
            interviewType,
        };
        localStorage.setItem(STORAGE_KEYS.INTERVIEW_CONTEXT, JSON.stringify(context));

        // Navigate to interview
        router.push("/interview");
    };

    const handleDeleteSeries = (seriesId: string) => {
        if (confirm("Are you sure you want to delete this interview series?")) {
            deleteSeries(seriesId);
            setSeriesList(getAllSeries());
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const getAverageScore = (series: SeriesHistory): number | null => {
        const sessionsWithScore = series.sessions.filter((s) => s.analysis?.overallScore);
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
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Interview Series</h1>
                        <p className="text-gray-400 mt-1">
                            Practice for roles with multiple sessions and track your progress.
                        </p>
                    </div>
                    <button
                        onClick={handleNewSeries}
                        className="btn-primary flex items-center space-x-2 px-5 py-2.5"
                    >
                        <Plus className="w-5 h-5" />
                        <span>New Series</span>
                    </button>
                </header>

                {/* Series List */}
                {seriesList.length === 0 ? (
                    <div className="glass-panel p-12 rounded-3xl text-center">
                        <div className="w-16 h-16 bg-dark-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Briefcase className="w-8 h-8 text-gray-500" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">No interview series yet</h2>
                        <p className="text-gray-400 mb-6 max-w-md mx-auto">
                            Create your first series to practice for a specific role. Upload your CV
                            and job description, then practice across multiple sessions.
                        </p>
                        <button
                            onClick={handleNewSeries}
                            className="btn-primary inline-flex items-center space-x-2 px-6 py-3"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Start Your First Series</span>
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {seriesList.map((series) => {
                            const isExpanded = expandedSeriesId === series.seriesId;
                            const avgScore = getAverageScore(series);

                            return (
                                <div
                                    key={series.seriesId}
                                    className="glass-panel rounded-2xl overflow-hidden"
                                >
                                    {/* Series Header */}
                                    <div
                                        className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                                        onClick={() =>
                                            setExpandedSeriesId(isExpanded ? null : series.seriesId)
                                        }
                                    >
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                                                <Target className="w-6 h-6 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg">
                                                    {series.seriesName}
                                                </h3>
                                                <div className="flex items-center space-x-3 text-sm text-gray-400 mt-0.5">
                                                    <span className="flex items-center space-x-1">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span>{formatDate(series.createdAt)}</span>
                                                    </span>
                                                    <span>•</span>
                                                    <span>{series.sessions.length} session(s)</span>
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
                                                    handleDeleteSeries(series.seriesId);
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
                                        <div className="border-t border-white/5 p-5 bg-dark-900/50">
                                            {/* Role Info */}
                                            <div className="flex items-center space-x-2 text-sm text-gray-400 mb-4">
                                                <FileText className="w-4 h-4" />
                                                <span>
                                                    {series.baseContext.roleTitle || "Role not specified"}
                                                </span>
                                            </div>

                                            {/* Past Sessions */}
                                            {series.sessions.length > 0 && (
                                                <div className="mb-6">
                                                    <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
                                                        Past Sessions
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {series.sessions.map((session, index) => (
                                                            <div
                                                                key={session.id}
                                                                className="flex items-center justify-between p-3 bg-dark-800/50 rounded-xl border border-white/5"
                                                            >
                                                                <div className="flex items-center space-x-3">
                                                                    <span className="w-6 h-6 rounded-full bg-dark-700 flex items-center justify-center text-xs font-medium text-gray-400">
                                                                        {index + 1}
                                                                    </span>
                                                                    <span
                                                                        className={`px-2 py-0.5 rounded text-xs font-medium border ${INTERVIEW_TYPE_COLORS[session.interviewType]
                                                                            }`}
                                                                    >
                                                                        {INTERVIEW_TYPE_LABELS[session.interviewType]}
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

                                            {/* Action Buttons */}
                                            <div className="flex flex-wrap gap-3">
                                                <button
                                                    onClick={() =>
                                                        handleContinueSeries(series.seriesId, "screening")
                                                    }
                                                    className="px-4 py-2 text-sm rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                                                >
                                                    Practice Screening
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleContinueSeries(series.seriesId, "hiring-manager")
                                                    }
                                                    className="px-4 py-2 text-sm rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors"
                                                >
                                                    Practice Hiring Manager
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleContinueSeries(series.seriesId, "cultural-fit")
                                                    }
                                                    className="px-4 py-2 text-sm rounded-lg border border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                                                >
                                                    Practice Cultural Fit
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
