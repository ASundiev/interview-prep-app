const apiKey = process.env.SYNTHESIA_API_KEY;

async function getAvatars() {
    if (!apiKey) {
        console.error("No API key found");
        return;
    }

    try {
        const response = await fetch("https://api.synthesia.io/v2/avatars", {
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
        console.log("Avatars found:", data.avatars ? data.avatars.length : 0);
        if (data.avatars && data.avatars.length > 0) {
            console.log("First avatar:", JSON.stringify(data.avatars[0], null, 2));
        }
    } catch (error) {
        console.error("Fetch error:", error);
    }
}

getAvatars();
