import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const { text, voice = "nova" } = await req.json();

        if (!text || typeof text !== "string") {
            return NextResponse.json(
                { error: "Text is required" },
                { status: 400 }
            );
        }

        // Check if API key is configured
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: "OpenAI API key is not configured." },
                { status: 500 }
            );
        }

        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: voice as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" | "ash" | "sage" | "coral",
            input: text,
            speed: 1.15,
        });

        // Get the audio data as an ArrayBuffer
        const audioBuffer = await mp3.arrayBuffer();

        // Return the audio as a response
        return new NextResponse(audioBuffer, {
            status: 200,
            headers: {
                "Content-Type": "audio/mpeg",
                "Content-Length": audioBuffer.byteLength.toString(),
            },
        });
    } catch (error: any) {
        console.error("Error in /api/tts:", error);
        return NextResponse.json(
            { error: error?.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
