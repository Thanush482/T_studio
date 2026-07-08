import { createFileRoute } from "@tanstack/react-router";
import { Client } from "@gradio/client";

type Kind = "clone" | "change" | "sfx";

const URL_ENV: Record<Kind, string> = {
  clone: "HF_VOICE_CLONE_URL",
  change: "HF_VOICE_CHANGE_URL",
  sfx: "HF_SFX_URL",
};

function pickAudio(output: unknown): string | null {
  const seen = new Set<unknown>();
  const walk = (v: unknown): string | null => {
    if (!v || seen.has(v)) return null;
    if (typeof v === "string") {
      if (/^https?:\/\/.+\.(wav|mp3|ogg|flac|m4a|webm)(\?|$)/i.test(v)) return v;
      if (v.startsWith("http") && v.includes("/file")) return v;
      return null;
    }
    if (typeof v !== "object") return null;
    seen.add(v);
    const o = v as Record<string, unknown>;
    if (typeof o.url === "string") return o.url;
    if (typeof o.path === "string" && typeof o.name === "string") return o.path;
    for (const val of Object.values(o)) {
      const found = walk(val);
      if (found) return found;
    }
    if (Array.isArray(v)) {
      for (const item of v) {
        const found = walk(item);
        if (found) return found;
      }
    }
    return null;
  };
  return walk(output);
}

export const Route = createFileRoute("/api/hf")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const form = await request.formData();
          const kind = String(form.get("kind") ?? "") as Kind;
          if (!URL_ENV[kind]) return new Response("Invalid kind", { status: 400 });

          const spaceUrl = process.env[URL_ENV[kind]];
          if (!spaceUrl) return new Response(`${URL_ENV[kind]} not configured`, { status: 500 });
          const hfToken = process.env.HF_TOKEN;

          const apiName = (form.get("apiName") as string) || "/predict";
          const prompt = (form.get("prompt") as string) || "";
          const file = form.get("file");
          const refFile = form.get("refFile");
          const extra = form.get("extra") ? JSON.parse(String(form.get("extra"))) : {};

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const opts: any = hfToken ? { hf_token: hfToken } : {};
          const client = await Client.connect(spaceUrl, opts);

          let inputs: unknown[];
          if (kind === "sfx") {
            const duration = Number(extra.duration ?? 5);
            inputs = [prompt, duration];
          } else if (kind === "clone") {
            // Chatterbox / Fish Audio typical: (text, reference_audio)
            if (!(refFile instanceof File)) return new Response("Reference audio required", { status: 400 });
            inputs = [prompt, refFile];
          } else {
            // voice change: (source_audio, target_reference_or_settings)
            if (!(file instanceof File)) return new Response("Source audio required", { status: 400 });
            inputs = refFile instanceof File ? [file, refFile] : [file, prompt];
          }

          const result = await client.predict(apiName, inputs);
          const data = (result as { data: unknown }).data;
          const audioUrl = pickAudio(data);
          if (!audioUrl) {
            return Response.json({ error: "No audio in response", raw: data }, { status: 502 });
          }
          return Response.json({ audioUrl });
        } catch (e) {
          console.error("hf proxy error", e);
          const msg = e instanceof Error ? e.message : "Unknown error";
          return new Response(msg, { status: 500 });
        }
      },
    },
  },
});