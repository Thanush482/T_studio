import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("AI gateway not configured", { status: 500 });

        const inbound = await request.formData();
        const file = inbound.get("file");
        if (!(file instanceof File)) {
          return new Response("Missing audio file", { status: 400 });
        }
        if (file.size < 1024) {
          return new Response("Recording is empty. Please try again.", { status: 400 });
        }
        if (file.size > 25 * 1024 * 1024) {
          return new Response("Audio too large (25MB max).", { status: 413 });
        }

        const mime = (file.type.split(";")[0] || "audio/webm").toLowerCase();
        const extMap: Record<string, string> = {
          "audio/webm": "webm",
          "audio/mp4": "mp4",
          "audio/mpeg": "mp3",
          "audio/mp3": "mp3",
          "audio/wav": "wav",
          "audio/x-wav": "wav",
          "audio/wave": "wav",
          "audio/m4a": "m4a",
          "audio/x-m4a": "m4a",
          "audio/ogg": "ogg",
          "audio/flac": "flac",
        };
        const ext = extMap[mime] ?? "webm";

        const upstream = new FormData();
        upstream.append("model", "openai/gpt-4o-transcribe");
        upstream.append("file", file, `recording.${ext}`);

        const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}` },
          body: upstream,
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.error("transcribe failed", res.status, text);
          if (res.status === 429) return new Response("Too many requests — please slow down.", { status: 429 });
          if (res.status === 402) return new Response("AI credits exhausted. Try again later.", { status: 402 });
          return new Response(text || `Transcription failed (${res.status})`, { status: res.status });
        }
        const json = (await res.json()) as { text?: string };
        return Response.json({ text: json.text ?? "" });
      },
    },
  },
});