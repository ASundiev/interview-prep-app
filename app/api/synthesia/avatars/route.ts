import { NextResponse } from "next/server";

const SYNTHESIA_API_KEY = process.env.SYNTHESIA_API_KEY;

export async function GET() {
    // Gracefully handle missing Synthesia API key - return empty array
    if (!SYNTHESIA_API_KEY) {
        console.warn("Synthesia API key not configured - returning empty avatars list");
        return NextResponse.json([]);
    }

    try {
        const response = await fetch("https://api.synthesia.io/v2/avatars?limit=50", {
            headers: {
                "Authorization": SYNTHESIA_API_KEY,
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("Synthesia Avatars Error:", error);
            return NextResponse.json({ error: "Failed to fetch avatars" }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching Synthesia avatars:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}


