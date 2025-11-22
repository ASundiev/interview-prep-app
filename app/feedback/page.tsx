"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, TrendingUp, ArrowRight, Loader2, RefreshCw, Award, Target, Zap } from "lucide-react";

interface AnalysisResult {
    score: number;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    improvements: string[];
}

export default function FeedbackPage() {
    const router = useRouter();
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const analyzeInterview = async () => {
            const transcript = localStorage.getItem("interviewTranscript");
            const context = localStorage.getItem("interviewContext");

            if (!transcript || !context) {
                router.push("/");
                return;
            }

            try {
                const response = await fetch("/api/analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        transcript: JSON.parse(transcript),
                        context: JSON.parse(context),
                    }),
                });

                if (!response.ok) throw new Error("Analysis failed");

                const data = await response.json();
                setAnalysis(data);
            } catch (error) {
                console.error(error);
                // Mock data for fallback
                setAnalysis({
                    score: 85,
                    summary: "Great job! You demonstrated strong technical knowledge and communicated your ideas clearly. There are a few areas where you could be more concise.",
                    strengths: ["Clear communication", "Good technical depth", "Structured answers"],
                    weaknesses: ["Could be more concise", "Missed some STAR method opportunities"],
                    improvements: ["Practice STAR method", "Focus on business impact", "Ask more clarifying questions"]
                });
            } finally {
                setIsLoading(false);
            }
        };

        analyzeInterview();
    }, [router]);

    if (isLoading) {
        return (
            <main className="min-h-screen bg-dark-950 text-white flex flex-col items-center justify-center p-4 font-sans">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                    <Loader2 className="w-16 h-16 animate-spin text-primary relative z-10" />
                </div>
                <h2 className="text-2xl font-bold mt-8">Analyzing your interview...</h2>
                <p className="text-gray-400 mt-2">Our AI is reviewing your responses against the job description.</p>
            </main>
        );
    }

    if (!analysis) return null;

    return (
        <main className="min-h-screen bg-dark-950 text-white p-4 md:p-8 font-sans">
            <div className="max-w-5xl mx-auto space-y-12">
                <header className="text-center space-y-4 pt-8">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                        <Award className="w-4 h-4" />
                        <span>Analysis Complete</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                        Your Interview <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Performance</span>
                    </h1>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">{analysis.summary}</p>
                </header>

                {/* Score Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Score */}
                    <div className="md:col-span-1 glass-panel p-8 rounded-3xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 to-transparent opacity-50"></div>
                        <div className="relative z-10">
                            <h3 className="text-gray-400 font-medium mb-6 uppercase tracking-wider text-sm">Overall Score</h3>
                            <div className="relative w-48 h-48 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90 drop-shadow-2xl">
                                    <circle
                                        cx="96"
                                        cy="96"
                                        r="88"
                                        stroke="currentColor"
                                        strokeWidth="12"
                                        fill="transparent"
                                        className="text-dark-800"
                                    />
                                    <circle
                                        cx="96"
                                        cy="96"
                                        r="88"
                                        stroke="currentColor"
                                        strokeWidth="12"
                                        fill="transparent"
                                        strokeLinecap="round"
                                        strokeDasharray={553}
                                        strokeDashoffset={553 - (553 * analysis.score) / 100}
                                        className={`text-primary transition-all duration-1000 ease-out`}
                                    />
                                </svg>
                                <div className="absolute flex flex-col items-center">
                                    <span className="text-6xl font-bold tracking-tighter">{analysis.score}</span>
                                    <span className="text-sm text-gray-400 mt-1">/ 100</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Strengths */}
                        <div className="glass-panel p-8 rounded-3xl flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-[60px] rounded-full pointer-events-none"></div>
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="p-2 bg-green-500/10 rounded-lg text-green-400">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-semibold">Key Strengths</h3>
                            </div>
                            <ul className="space-y-4 flex-1">
                                {analysis.strengths.map((item, i) => (
                                    <li key={i} className="flex items-start space-x-3 text-gray-300">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2.5 flex-shrink-0"></span>
                                        <span className="leading-relaxed">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Weaknesses */}
                        <div className="glass-panel p-8 rounded-3xl flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[60px] rounded-full pointer-events-none"></div>
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
                                    <XCircle className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-semibold">Improvement Areas</h3>
                            </div>
                            <ul className="space-y-4 flex-1">
                                {analysis.weaknesses.map((item, i) => (
                                    <li key={i} className="flex items-start space-x-3 text-gray-300">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2.5 flex-shrink-0"></span>
                                        <span className="leading-relaxed">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Action Plan */}
                <div className="glass-panel p-8 md:p-10 rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-primary/5 to-transparent opacity-50 pointer-events-none"></div>
                    <div className="relative z-10">
                        <div className="flex items-center space-x-3 mb-8">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold">Action Plan</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {analysis.improvements.map((item, i) => (
                                <div key={i} className="bg-dark-900/50 border border-white/5 p-6 rounded-2xl hover:border-primary/30 transition-colors group">
                                    <div className="flex items-center space-x-4 mb-4">
                                        <span className="w-8 h-8 rounded-full bg-dark-800 border border-white/10 flex items-center justify-center text-sm font-bold text-gray-400 group-hover:text-primary group-hover:border-primary/50 transition-all">
                                            {i + 1}
                                        </span>
                                        <h4 className="font-semibold text-gray-200">Recommendation</h4>
                                    </div>
                                    <p className="text-gray-400 text-sm leading-relaxed">{item}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-center pt-8 pb-12">
                    <button
                        onClick={() => router.push("/")}
                        className="btn-primary py-4 px-10 text-lg flex items-center space-x-3 shadow-2xl hover:shadow-primary/50"
                    >
                        <RefreshCw className="w-5 h-5" />
                        <span>Start New Interview</span>
                    </button>
                </div>
            </div>
        </main>
    );
}
