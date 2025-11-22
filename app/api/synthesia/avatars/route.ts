import { NextResponse } from "next/server";

const SYNTHESIA_API_KEY = process.env.SYNTHESIA_API_KEY;

export async function GET() {
    if (!SYNTHESIA_API_KEY) {
        return NextResponse.json({ error: "Synthesia API key not configured" }, { status: 500 });
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


