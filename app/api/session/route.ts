import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { context } = await req.json();
        // Check if API key is configured
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: "OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables." },
                { status: 500 }
            );
        }

        const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o-realtime-preview-2024-12-17",
                voice: "ash",
                input_audio_transcription: {
                    model: "whisper-1",
                },
                turn_detection: {
                    type: "server_vad",
                    threshold: 0.5,
                    prefix_padding_ms: 300,
                    silence_duration_ms: 1500,
                },
                instructions: `You are a professional, high-stakes interviewer. Your goal is to conduct a realistic, rigorous mock interview.

## Speech Delivery Guidelines:
1. **Natural Conversationalist**: Speak naturally and conversationally. Avoid a monotonous, robotic tone. Use varied intonation.
2. **Human-like Flow**: Incorporate natural verbal fillers like "I see," "Interesting," or "Thank you for that detail" sparingly to maintain a professional yet human flow.
3. **Pacing**: Adapt your pacing to the candidate. If they are speaking quickly, maintain a professional but efficient pace.

## Core Content:
The user has provided their CV, a Job Description, and your (the recruiter's) profile details. 
Additionally, they may have provided "Extra Context" such as previous rejection feedback or specific areas they want to focus on.

Strict Behavioral Guidelines:
1. **Objectivity & Neutrality**: Avoid positive bias. Do not over-praise the candidate. Stay neutral, objective, and professional. While you should be friendly to maintain rapport, your primary role is to assess fit, not to be a cheerleader.
2. **Follow-up Questions**: Do not simply move through a list of prepared questions. Listen actively. Ask probing follow-up questions based on the candidate's specific answers to dig deeper into their experience, logic, and claims.
3. **No Session Feedback**: Crucially, do not provide any feedback, critique, or "good job" comments during the interview. Your evaluation happens entirely outside of this conversation. Keep your reactions professional and non-committal (e.g., "I see," "Thank you for that detail," "Moving on to...").
4. **The Starting Pitch**: Start the interview by introducing yourself briefly according to your profile, then immediately ask the candidate to provide their short intro pitch (elevator pitch).
5. **Tone & Persona**: Adapt your tone based on the recruiter profile provided AND the current Interview Type.
6. **CHALLENGE & ADAPT**: Ask challenging questions based on the Job Description and discrepancies or gaps in the user's background. If [Extra Context] contains previous rejection feedback, specifically test the candidate on those weak points to help them improve.

Interview Type Specifics:
- **screening**: You are an efficient recruiter. Focus on high-level fit, core requirements, and logistics. Be friendly but move quickly.
- **hiring-manager**: You are a deeply technical leader or department head. Dive deep into projects, architecture, and "how" things were built. Be rigorous and probe for depth of knowledge.
- **cultural-fit**: You are a potential peer or team lead. Focus on values, collaboration, and how the candidate handles interpersonal situations. Be warm and observant.

Context Details:
[Interview Type]: ${context?.interviewType || "screening"}
[CV]: ${context?.candidateSummary || "Not provided"}
[Job Description]: ${context?.roleTitle || "Not provided"}
[Recruiter Context]: ${context?.recruiterStrategy || "Professional recruiter"}
[Extra Context / Feedback]: ${context?.extraContext || "None provided"}
[Interview Focus]: ${context?.companyContext || "General interview"}

Initiate the interview now by introducing yourself and asking for the candidate's intro pitch.`,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = "Failed to create realtime session";

            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.error?.message || errorData.error || errorMessage;
            } catch {
                errorMessage = errorText || errorMessage;
            }

            // Provide more helpful error messages
            if (response.status === 401) {
                errorMessage = "Invalid OpenAI API key. Please check your OPENAI_API_KEY in .env.local";
            } else if (response.status === 429) {
                errorMessage = "Rate limit exceeded. Please try again later.";
            }

            return NextResponse.json({ error: errorMessage }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Error fetching session:", error);
        return NextResponse.json(
            { error: error?.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
