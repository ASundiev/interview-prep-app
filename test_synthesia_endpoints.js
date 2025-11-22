const apiKey = process.env.SYNTHESIA_API_KEY;

async function testEndpoints() {
    if (!apiKey) {
        console.error("No API key found");
        return;
    }

    const endpoints = [
        "https://api.synthesia.io/v2/templates?limit=1",
        "https://api.synthesia.io/v2/avatars",
        "https://api.synthesia.io/v2/avatars?limit=1"
    ];

    for (const url of endpoints) {
        console.log(`Testing ${url}...`);
        try {
            const response = await fetch(url, {
                headers: {
                    "Authorization": apiKey,
                    "Content-Type": "application/json"
                }
            });

            console.log(`Status: ${response.status}`);
            if (response.ok) {
                const data = await response.json();
                console.log("Success:", JSON.stringify(data).substring(0, 100) + "...");
            } else {
                const text = await response.text();
                console.log("Error body:", text.substring(0, 100));
            }
        } catch (error) {
            console.error("Fetch error:", error);
        }
        console.log("---");
    }
}

testEndpoints();
