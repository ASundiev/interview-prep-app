const apiKey = process.env.SYNTHESIA_API_KEY;

async function getVideos() {
    if (!apiKey) {
        console.error("No API key found");
        return;
    }

    console.log("Testing API Key:", apiKey.substring(0, 5) + "...");

    try {
        const response = await fetch("https://api.synthesia.io/v2/videos?limit=1", {
            headers: {
                "Authorization": apiKey,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            console.error(`Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error(text);
            return;
        }

        const data = await response.json();
        console.log("Videos found:", data.videos ? data.videos.length : 0);
    } catch (error) {
        console.error("Fetch error:", error);
    }
}

getVideos();
