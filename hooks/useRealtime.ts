import { useEffect, useRef, useState } from "react";

export function useRealtime() {
    const [status, setStatus] = useState("disconnected");
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [items, setItems] = useState<{ role: string; text: string }[]>([]);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const dcRef = useRef<RTCDataChannel | null>(null);
    const audioElRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Create audio element for playback
        if (typeof window !== "undefined") {
            audioElRef.current = document.createElement("audio");
            audioElRef.current.autoplay = true;
        }

        return () => {
            if (pcRef.current) pcRef.current.close();
            if (audioElRef.current) audioElRef.current.remove();
        };
    }, []);

    const connect = async () => {
        setStatus("connecting");
        try {
            // 1. Get ephemeral token
            const tokenRes = await fetch("/api/session", { method: "POST" });
            const data = await tokenRes.json();
            const EPHEMERAL_KEY = data.client_secret.value;

            // 2. Initialize WebRTC
            const pc = new RTCPeerConnection();
            pcRef.current = pc;

            // Handle remote audio
            pc.ontrack = (e) => {
                if (audioElRef.current) {
                    audioElRef.current.srcObject = e.streams[0];
                }
            };

            // Data channel for events
            const dc = pc.createDataChannel("oai-events");
            dcRef.current = dc;
            dc.onmessage = (e) => {
                const event = JSON.parse(e.data);
                if (event.type === "response.audio.delta") {
                    setIsSpeaking(true);
                } else if (event.type === "response.done") {
                    setIsSpeaking(false);
                } else if (event.type === "response.audio_transcript.done") {
                    setItems((prev) => [...prev, { role: "assistant", text: event.transcript }]);
                } else if (event.type === "conversation.item.input_audio_transcription.completed") {
                    setItems((prev) => [...prev, { role: "user", text: event.transcript }]);
                }
            };

            // 3. Capture microphone
            const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
            pc.addTrack(ms.getTracks()[0]);

            // 4. Create offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            // 5. Connect to OpenAI
            const baseUrl = "https://api.openai.com/v1/realtime";
            const model = process.env.NEXT_PUBLIC_OPENAI_REALTIME_MODEL || "gpt-4o-realtime-preview-2024-12-17";
            const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
                method: "POST",
                body: offer.sdp,
                headers: {
                    Authorization: `Bearer ${EPHEMERAL_KEY}`,
                    "Content-Type": "application/sdp",
                },
            });

            const answerSdp = await sdpResponse.text();
            await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

            setStatus("connected");
        } catch (error) {
            console.error("Realtime connection failed:", error);
            setStatus("error");
        }
    };

    const disconnect = () => {
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }
        setStatus("disconnected");
    };

    return { connect, disconnect, status, isSpeaking, items };
}
