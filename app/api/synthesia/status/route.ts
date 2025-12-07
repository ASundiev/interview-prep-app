import { NextRequest, NextResponse } from "next/server";

const SYNTHESIA_API_KEY = process.env.SYNTHESIA_API_KEY;

export async function GET(req: NextRequest) {
    // Gracefully handle missing Synthesia API key
    if (!SYNTHESIA_API_KEY) {
        console.warn("Synthesia API key not configured - returning mock status");
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        
        // If it's a mock ID, return complete status
        if (id === "mock-video-id") {
            return NextResponse.json({ 
                status: "complete",
                download: null
            });
        }
        
        return NextResponse.json({ error: "Synthesia API key not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    try {
        const response = await fetch(`https://api.synthesia.io/v2/videos/${id}`, {
            headers: {
                "Authorization": SYNTHESIA_API_KEY,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            return NextResponse.json({ error: "Failed to fetch status" }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching Synthesia status:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
