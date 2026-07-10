import { createFileRoute } from "@tanstack/react-router";
import { Client } from "@gradio/client";

type Kind = "clone" | "change" | "sfx" | "faceswap-img" | "faceswap-vid" | "train" | "video";

const URL_ENV: Record<Kind, string> = {
  clone: "HF_VOICE_CLONE_URL",
  change: "HF_VOICE_CHANGE_URL",
  sfx: "HF_SFX_URL",
  "faceswap-img": "HF_FACESWAP_IMG_URL",
  "faceswap-vid": "HF_FACESWAP_VID_URL",
  train: "HF_TRAIN_URL",
  video: "HF_VIDEO_URL",
};

const MEDIA_RE = /\.(wav|mp3|ogg|flac|m4a|webm|png|jpg|jpeg|gif|webp|bmp|mp4|mov|mkv|avi|zip|safetensors|ckpt|bin|pt)(\?|$)/i;

function pickMedia(output: unknown): string | null {
  const seen = new Set<unknown>();
  const walk = (v: unknown): string | null => {
    if (!v || seen.has(v)) return null;
    if (typeof v === "string") {
      if (/^https?:\/\/.+/.test(v) && MEDIA_RE.test(v)) return v;
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
          } else if (kind === "change") {
            // voice change: (source_audio, target_reference_or_settings)
            if (!(file instanceof File)) return new Response("Source audio required", { status: 400 });
            inputs = refFile instanceof File ? [file, refFile] : [file, prompt];
          } else if (kind === "faceswap-img") {
            // ReActor / InsightFace typical: (source_face_image, target_image)
            if (!(file instanceof File) || !(refFile instanceof File))
              return new Response("Source face image and target image required", { status: 400 });
            inputs = [file, refFile];
          } else if (kind === "faceswap-vid") {
            // Roop / FaceFusion typical: (source_face_image, target_video)
            if (!(file instanceof File) || !(refFile instanceof File))
              return new Response("Source face image and target video required", { status: 400 });
            inputs = [file, refFile];
          } else if (kind === "video") {
            // text-to-video: (prompt, [duration|seconds|frames])
            if (!prompt) return new Response("Prompt required", { status: 400 });
            const duration = Number(extra.duration ?? 4);
            inputs = [prompt, duration];
          } else {
            // train: expect a zip/tar of images + trigger word
            if (!(file instanceof File)) return new Response("Training data (zip) required", { status: 400 });
            const steps = Number(extra.steps ?? 1000);
            inputs = [file, prompt || "sks", steps];
          }

          const result = await client.predict(apiName, inputs);
          const data = (result as { data: unknown }).data;
          const mediaUrl = pickMedia(data);
          if (!mediaUrl) {
            return Response.json({ error: "No media in response", raw: data }, { status: 502 });
          }
          return Response.json({ audioUrl: mediaUrl, mediaUrl });
        } catch (e) {
          console.error("hf proxy error", e);
          const msg = e instanceof Error ? e.message : "Unknown error";
          return new Response(msg, { status: 500 });
        }
      },
    },
  },
});