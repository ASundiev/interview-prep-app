import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    // In a real app, you'd verify the webhook signature here
    try {
        const event = await req.json();
        
        // Log the event for now. In production, you'd update a database.
        console.log("Synthesia Webhook Received:", event);

        if (event.type === "video.completed") {
            // TODO: Notify the frontend (e.g., via Supabase realtime or polling)
            console.log("Video Completed:", event.data.id, event.data.download);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: "Invalid Webhook" }, { status: 400 });
    }
}

