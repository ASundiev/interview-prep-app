// Types for User Profile and Role management

// ============== Messages & Analysis ==============

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

// ============== Interview Session ==============

export interface InterviewSession {
    id: string;
    stageId: string;              // References InterviewStage.id
    stageName: string;            // Denormalized for display
    startedAt: string;
    endedAt: string;
    transcript: Message[];
    analysis: AnalysisResult | null;
}

// ============== Interview Stages ==============

export interface InterviewStage {
    id: string;
    name: string;                 // "Screening", "Technical", "Bar Raiser", etc.
    description: string;          // Brief description for AI context
}

export const DEFAULT_INTERVIEW_STAGES: InterviewStage[] = [
    {
        id: "screening",
        name: "Screening",
        description: "Recruiter call focusing on logistics, salary expectations, and high-level fit assessment.",
    },
    {
        id: "hiring-manager",
        name: "Hiring Manager",
        description: "Deep dive into experience, technical skills, project impact, and problem-solving abilities.",
    },
    {
        id: "cultural-fit",
        name: "Cultural Fit",
        description: "Values alignment, collaboration style, team dynamics, and interpersonal skills assessment.",
    },
];

// ============== User Profile ==============

export interface UserProfile {
    name: string;
    background: string;           // AI-generated summary from CV
    strengths: string[];          // AI-extracted key skills/achievements
    preferences: string;          // User-provided interview preferences
    defaultCvText: string | null;
    defaultCvFileName: string | null;
    createdAt: string;
    updatedAt: string;
}

// ============== Role (formerly Series) ==============

export interface Role {
    roleId: string;
    roleName: string;             // "DevRev - Senior Designer"
    companyName: string;
    roleTitle: string;
    jdText: string | null;
    jdFileName: string | null;
    recruiterText: string | null;
    recruiterFileName: string | null;
    extraContext: string | null;
    customCvText: string | null;  // Override CV for this role
    customCvFileName: string | null;
    stages: InterviewStage[];     // Custom stages for this role
    createdAt: string;
    sessions: InterviewSession[];
}

// ============== Storage Keys ==============

export const STORAGE_KEYS = {
    USER_PROFILE: "userProfile",
    ROLES_LIST: "rolesList",
    ACTIVE_ROLE_ID: "activeRoleId",
    ACTIVE_SESSION_ID: "activeSessionId",
    ACTIVE_STAGE_ID: "activeStageId",
    INTERVIEW_CONTEXT: "interviewContext",
    INTERVIEW_TRANSCRIPT: "interviewTranscript",
    // Legacy keys (for migration)
    SERIES_LIST: "interviewSeriesList",
    ACTIVE_SERIES_ID: "activeSeriesId",
} as const;

// ============== Context passed to AI ==============

export interface InterviewContext {
    // From UserProfile
    userName?: string;
    userBackground?: string;
    userStrengths?: string[];
    userPreferences?: string;
    cvText?: string;

    // From Role
    roleName?: string;
    companyName?: string;
    roleTitle?: string;
    jdText?: string;
    recruiterText?: string;
    extraContext?: string | null;

    // From Stage
    stageName?: string;
    stageDescription?: string;

    // Past feedback
    pastFeedback?: string | null;

    // Legacy fields for backwards compatibility
    candidateName?: string;
    candidateSummary?: string;
    interviewQuestions?: string[];
    companyContext?: string;
    interviewType?: string;
    recruiterStrategy?: string;
}
