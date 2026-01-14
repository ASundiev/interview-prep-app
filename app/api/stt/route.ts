import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const audioFile = formData.get("audio") as File;

        if (!audioFile) {
            return NextResponse.json(
                { error: "No audio file provided" },
                { status: 400 }
            );
        }

        // Transcribe with prompt to encourage proper punctuation
        const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: "whisper-1",
            language: "en",
            response_format: "text",
            // This prompt guides Whisper to include proper punctuation and capitalization
            prompt: "This is an interview response. Please include proper punctuation, capitalization, and sentence structure.",
        });

        return NextResponse.json({ text: transcription });
    } catch (error: any) {
        console.error("Whisper STT error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to transcribe audio" },
            { status: 500 }
        );
    }
}
