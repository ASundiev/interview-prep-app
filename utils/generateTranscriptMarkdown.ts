import { InterviewContext, AnalysisResult, Message } from "@/types/profile";

interface TranscriptItem {
    role: string;
    text: string;
}

export function generateTranscriptMarkdown(
    transcript: TranscriptItem[],
    context: InterviewContext,
    analysis: AnalysisResult | null,
    date: Date = new Date()
): string {
    const interviewTypeLabels: Record<string, string> = {
        screening: "Screening Interview",
        "hiring-manager": "Hiring Manager Interview",
        "cultural-fit": "Cultural Fit Interview",
    };

    const formattedDate = date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    let md = `# Interview Session Report\n\n`;
    md += `**Date:** ${formattedDate}\n`;
    md += `**Role:** ${context.roleTitle || "Not specified"}\n`;
    md += `**Interview Type:** ${interviewTypeLabels[context.interviewType || ""] || context.interviewType || "Not specified"}\n`;
    if (context.candidateName) {
        md += `**Candidate:** ${context.candidateName}\n`;
    }
    md += `\n---\n\n`;

    // Transcript section
    md += `## Interview Transcript\n\n`;
    if (transcript.length === 0) {
        md += `*No transcript recorded*\n\n`;
    } else {
        transcript.forEach((item) => {
            const speaker = item.role === "assistant" ? "**AI Interviewer:**" : "**Candidate:**";
            md += `${speaker} ${item.text}\n\n`;
        });
    }
    md += `---\n\n`;

    // Evaluation section
    md += `## Evaluation Results\n\n`;
    if (!analysis) {
        md += `*Evaluation not available*\n\n`;
    } else {
        md += `### Overall Score: ${analysis.overallScore}/100\n\n`;
        md += `### Summary\n${analysis.feedbackSummary}\n\n`;

        md += `### Key Strengths\n`;
        analysis.strengths.forEach((s) => {
            md += `- ${s}\n`;
        });
        md += `\n`;

        md += `### Areas for Improvement\n`;
        analysis.weaknesses.forEach((w) => {
            md += `- ${w}\n`;
        });
        md += `\n`;

        md += `### Action Plan\n`;
        analysis.improvementTips.forEach((tip, i) => {
            md += `${i + 1}. ${tip}\n`;
        });
        md += `\n`;
    }

    return md;
}
