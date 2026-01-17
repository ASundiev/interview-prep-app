// Types for Interview Series feature

export interface Message {
    role: "user" | "assistant";
    text: string;
}

export interface AnalysisResult {
    overallScore: number;
    feedbackSummary: string;
    strengths: string[];
    weaknesses: string[];
    improvementTips: string[];
}

export interface InterviewContext {
    candidateName?: string;
    candidateSummary?: string;
    roleTitle?: string;
    roleRequirements?: string[];
    interviewQuestions?: string[];
    companyContext?: string;
    extraContext?: string | null;
    interviewType?: "screening" | "hiring-manager" | "cultural-fit";
    recruiterStrategy?: string;
}

export interface InterviewSession {
    id: string;
    interviewType: "screening" | "hiring-manager" | "cultural-fit";
    startedAt: string;
    endedAt: string;
    transcript: Message[];
    analysis: AnalysisResult | null;
}

export interface SeriesHistory {
    seriesId: string;
    seriesName: string;
    createdAt: string;
    baseContext: InterviewContext;
    sessions: InterviewSession[];
}

// Storage keys
export const STORAGE_KEYS = {
    SERIES_LIST: "interviewSeriesList",
    ACTIVE_SERIES_ID: "activeSeriesId",
    ACTIVE_SESSION_ID: "activeSessionId",
    // Legacy keys for backwards compatibility
    INTERVIEW_CONTEXT: "interviewContext",
    INTERVIEW_TRANSCRIPT: "interviewTranscript",
} as const;
