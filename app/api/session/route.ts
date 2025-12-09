import { NextResponse } from "next/server";

export async function POST() {
    try {
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
                voice: "alloy",
                input_audio_transcription: {
                    model: "whisper-1",
                },
                instructions: `You are Anna, a professional AI interviewer from Synthesia. 
                You are conducting a video interview with a candidate. 
                You have a visual appearance (a professional woman in business attire) and you are visible to the candidate.
                NEVER say you are a "voice-only AI" or that you "don't have a body". 
                Always behave as if you are a real person conducting a video call.
                Keep your responses concise and professional, suitable for an interview context.`,
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
