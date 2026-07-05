import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { downloadToStorage, falRun, replicateRun, uploadDataUrl } from "./providers.server";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";

// ─── Text-to-Speech (Lovable AI) ────────────────────────────────────────────
const TTSSchema = z.object({
  text: z.string().min(1).max(4000),
  voice: z.enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]).default("alloy"),
});

export const synthesizeSpeech = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => TTSSchema.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway not configured");
    const res = await fetch(`${GATEWAY}/audio/speech`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini-tts",
        input: data.text,
        voice: data.voice,
        response_format: "mp3",
      }),
    });
    if (!res.ok) {
      if (res.status === 429) throw new Error("Too many requests — please slow down.");
      if (res.status === 402) throw new Error("AI credits exhausted. Try again later.");
      throw new Error(`Speech generation failed (${res.status})`);
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    const base64 = btoa(String.fromCharCode(...buf));
    return { audioUrl: `data:audio/mpeg;base64,${base64}` };
  });

const MODERATION_SYSTEM = `You are a strict safety classifier for T_AI Studio, an AI image generator.
Return ONLY one word: "allow" or "block".
Block if the prompt requests any of:
- nudity, sexual content, or sexualization
- minors / children in any suggestive or face-altering context
- real named celebrities, politicians, or public figures (deepfake risk)
- government IDs, currency, fake documents
- violence, gore, terrorism, hate symbols
- self-harm or instructions for harm
- non-consensual face/body of real people
Otherwise return "allow".`;

const InputSchema = z.object({
  prompt: z.string().min(3).max(2000),
});

const EditSchema = z.object({
  prompt: z.string().min(3).max(2000),
  imageDataUrl: z.string().min(20).max(15_000_000), // base64 data URL, ~10MB cap
});

function getImageProviderFinishReason(response: unknown) {
  const payload = response as {
    choices?: Array<{ finish_reason?: string | null; native_finish_reason?: string | null }>;
  };
  const choice = payload.choices?.[0];
  return (choice?.native_finish_reason ?? choice?.finish_reason ?? "").toUpperCase();
}

function isImagePolicyFinish(reason: string) {
  return reason.includes("PROHIBITED") || reason.includes("SAFETY") || reason.includes("CONTENT_FILTER");
}

export const generateImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway not configured");

    // 1. Moderation
    const modRes = await fetch(`${GATEWAY}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: MODERATION_SYSTEM },
          { role: "user", content: data.prompt },
        ],
      }),
    });
    if (!modRes.ok) {
      if (modRes.status === 429) throw new Error("Too many requests — please slow down.");
      if (modRes.status === 402) throw new Error("AI credits exhausted. Try again later.");
      throw new Error("Moderation service unavailable");
    }
    const modJson = await modRes.json();
    const verdict = (modJson.choices?.[0]?.message?.content ?? "").trim().toLowerCase();
    const blocked = verdict === "block";

    await supabaseAdmin.from("moderation_logs").insert({
      user_id: userId,
      verdict: blocked ? "blocked" : "allowed",
      prompt: data.prompt,
      raw_response: { model: "google/gemini-2.5-flash-lite", response: verdict },
    });

    if (blocked) {
      throw new Error("This prompt violates our safety policy. Please try a different idea.");
    }

    // 2. Generate
    const watermarkedPrompt = `${data.prompt}\n\n(Add a small "T_AI Studio" watermark in the bottom-right corner.)`;
    const genRes = await fetch(`${GATEWAY}/images/generations`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-image-2",
        prompt: watermarkedPrompt,
        quality: "low",
        size: "1024x1024",
        n: 1,
      }),
    });
    if (!genRes.ok) {
      if (genRes.status === 429) throw new Error("Too many requests — please slow down.");
      if (genRes.status === 402) throw new Error("AI credits exhausted. Try again later.");
      const errText = await genRes.text().catch(() => "");
      console.error("generateImage failed", genRes.status, errText);
      throw new Error(`Image generation failed (${genRes.status})`);
    }
    const genJson = await genRes.json();
    const b64 = genJson.data?.[0]?.b64_json as string | undefined;
    const url = genJson.data?.[0]?.url as string | undefined;
    if (!b64 && !url) {
      console.error("generateImage: no image in response", JSON.stringify(genJson).slice(0, 2000));
      throw new Error("The model didn't return an image. Try a different prompt.");
    }

    let storageUrl: string | null = null;
    const fileName = `${userId}/${crypto.randomUUID()}.png`;

    if (b64) {
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const { error: upErr } = await supabaseAdmin.storage
        .from("generations")
        .upload(fileName, bytes, { contentType: "image/png", upsert: false });
      if (!upErr) {
        const { data: signed } = await supabaseAdmin.storage
          .from("generations")
          .createSignedUrl(fileName, 60 * 60 * 24 * 7);
        storageUrl = signed?.signedUrl ?? null;
      }
    }

    // 3. Record generation (free preview — no credit decrement)
    const { data: row } = await supabaseAdmin
      .from("generations")
      .insert({
        user_id: userId,
        tool: "text_to_image",
        prompt: data.prompt,
        model: "google/gemini-2.5-flash-image",
        output_asset_path: b64 ? fileName : null,
        output_url: !b64 && url ? url : null,
        status: "completed",
        moderation_result: { verdict },
      })
      .select("id")
      .single();

    return {
      id: row?.id,
      imageUrl: storageUrl ?? url ?? (b64 ? `data:image/png;base64,${b64}` : null),
    };
  });

export const editImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => EditSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway not configured");

    if (!data.imageDataUrl.startsWith("data:image/")) {
      throw new Error("Invalid image upload.");
    }

    // Moderation on prompt
    const modRes = await fetch(`${GATEWAY}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: MODERATION_SYSTEM },
          { role: "user", content: data.prompt },
        ],
      }),
    });
    if (!modRes.ok) {
      if (modRes.status === 429) throw new Error("Too many requests — please slow down.");
      if (modRes.status === 402) throw new Error("AI credits exhausted. Try again later.");
      throw new Error("Moderation service unavailable");
    }
    const modJson = await modRes.json();
    const verdict = (modJson.choices?.[0]?.message?.content ?? "").trim().toLowerCase();
    const blocked = verdict === "block";

    await supabaseAdmin.from("moderation_logs").insert({
      user_id: userId,
      verdict: blocked ? "blocked" : "allowed",
      prompt: data.prompt,
      raw_response: { model: "google/gemini-2.5-flash-image", response: verdict, tool: "edit_image" },
    });
    if (blocked) {
      throw new Error("This edit prompt violates our safety policy.");
    }

    // Edit via gemini-2.5-flash-image multimodal chat completions
    const watermarkedPrompt = `${data.prompt}\n\nKeep a small "T_AI Studio" watermark in the bottom-right corner of the output image.`;
    const editRes = await fetch(`${GATEWAY}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        modalities: ["image", "text"],
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: watermarkedPrompt },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
      }),
    });
    if (!editRes.ok) {
      if (editRes.status === 429) throw new Error("Too many requests — please slow down.");
      if (editRes.status === 402) throw new Error("AI credits exhausted. Try again later.");
      throw new Error(`Image edit failed (${editRes.status})`);
    }
    const editJson = await editRes.json();
    const message = editJson.choices?.[0]?.message;
    // Response shape varies: try multiple locations
    let imageUrlOut: string | undefined =
      message?.images?.[0]?.image_url?.url ??
      message?.images?.[0]?.url ??
      undefined;
    if (!imageUrlOut && Array.isArray(message?.content)) {
      for (const part of message.content) {
        if (part?.type === "image_url" && part?.image_url?.url) { imageUrlOut = part.image_url.url; break; }
        if (part?.type === "output_image" && part?.image_url?.url) { imageUrlOut = part.image_url.url; break; }
        if (part?.image_url?.url) { imageUrlOut = part.image_url.url; break; }
        if (typeof part?.b64_json === "string") { imageUrlOut = `data:image/png;base64,${part.b64_json}`; break; }
      }
    }
    if (!imageUrlOut) {
      const finishReason = getImageProviderFinishReason(editJson);
      console.error("editImage: no image in response", JSON.stringify(editJson).slice(0, 2000));
      if (isImagePolicyFinish(finishReason)) {
        return {
          id: null,
          imageUrl: null,
          error: "This edit was blocked by the image safety system. Try a non-sensitive photo or a safer edit.",
        };
      }
      return {
        id: null,
        imageUrl: null,
        error: "The model didn't return an image. Try a simpler prompt or a different photo.",
      };
    }

    // Upload to storage if it's a data URL
    let storageUrl: string | null = null;
    let storedPath: string | null = null;
    if (imageUrlOut.startsWith("data:")) {
      const b64 = imageUrlOut.split(",")[1] ?? "";
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const fileName = `${userId}/${crypto.randomUUID()}.png`;
      const { error: upErr } = await supabaseAdmin.storage
        .from("generations")
        .upload(fileName, bytes, { contentType: "image/png", upsert: false });
      if (!upErr) {
        storedPath = fileName;
        const { data: signed } = await supabaseAdmin.storage
          .from("generations")
          .createSignedUrl(fileName, 60 * 60 * 24 * 7);
        storageUrl = signed?.signedUrl ?? null;
      }
    }

    const { data: row } = await supabaseAdmin
      .from("generations")
      .insert({
        user_id: userId,
        tool: "image_edit",
        prompt: data.prompt,
        model: "google/gemini-2.5-flash-image",
        output_asset_path: storedPath,
        output_url: storedPath ? null : imageUrlOut,
        status: "completed",
        moderation_result: { verdict },
      })
      .select("id")
      .single();

    return {
      id: row?.id,
      imageUrl: storageUrl ?? imageUrlOut,
    };
  });
// ─── Face Swap (Replicate) ──────────────────────────────────────────────────
const FaceSwapSchema = z.object({
  targetImage: z.string().min(20).max(15_000_000),
  faceImage: z.string().min(20).max(15_000_000),
  consent: z.literal(true),
});

export const faceSwap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => FaceSwapSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await supabaseAdmin.from("consents").insert({
      user_id: userId,
      consent_type: "face_swap_subject_permission",
      version: "v1",
    });

    const [target, face] = await Promise.all([
      uploadDataUrl(userId, data.targetImage, "inputs"),
      uploadDataUrl(userId, data.faceImage, "inputs"),
    ]);

    const output = await replicateRun("cdingram/face-swap", {
      input_image: target.url,
      swap_image: face.url,
    });
    const url = Array.isArray(output) ? (output[0] as string) : (output as string);
    if (!url || typeof url !== "string") throw new Error("Face swap returned no image");

    const stored = await downloadToStorage(url, userId, "png", "image/png");

    const { data: row } = await supabaseAdmin
      .from("generations")
      .insert({
        user_id: userId,
        tool: "face_swap_image",
        prompt: "face swap",
        model: "cdingram/face-swap",
        input_asset_paths: [target.path, face.path],
        output_asset_path: stored.path,
        status: "completed",
      })
      .select("id")
      .single();

    return { id: row?.id, imageUrl: stored.url };
  });

// ─── Text-to-Video (fal.ai) ─────────────────────────────────────────────────
const VideoSchema = z.object({
  prompt: z.string().min(3).max(2000),
  duration: z.number().int().min(5).max(10).optional().default(5),
});

export const generateVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => VideoSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    // Moderate prompt
    const apiKey = process.env.LOVABLE_API_KEY;
    if (apiKey) {
      const modRes = await fetch(`${GATEWAY}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: MODERATION_SYSTEM },
            { role: "user", content: data.prompt },
          ],
        }),
      });
      if (modRes.ok) {
        const j = await modRes.json();
        const v = (j.choices?.[0]?.message?.content ?? "").trim().toLowerCase();
        await supabaseAdmin.from("moderation_logs").insert({
          user_id: userId,
          verdict: v.startsWith("block") ? "blocked" : "allowed",
          prompt: data.prompt,
          raw_response: { tool: "text_to_video", response: v },
        });
        if (v.startsWith("block")) throw new Error("This prompt violates our safety policy.");
      }
    }

    const result = await falRun("fal-ai/kling-video/v1/standard/text-to-video", {
      prompt: `${data.prompt}\n\n(Include a small "T_AI Studio" watermark in the bottom-right corner.)`,
      duration: String(data.duration),
      aspect_ratio: "16:9",
    });
    const videoUrl = (result.video as { url?: string } | undefined)?.url;
    if (!videoUrl) throw new Error("Video generation returned no output");

    const stored = await downloadToStorage(videoUrl, userId, "mp4", "video/mp4");

    const { data: row } = await supabaseAdmin
      .from("generations")
      .insert({
        user_id: userId,
        tool: "text_to_video",
        prompt: data.prompt,
        model: "fal-ai/kling-video/v1/standard/text-to-video",
        output_asset_path: stored.path,
        status: "completed",
      })
      .select("id")
      .single();

    return { id: row?.id, videoUrl: stored.url };
  });

// ─── Body / Outfit Swap (fal.ai IDM-VTON) ───────────────────────────────────
const BodySwapSchema = z.object({
  personImage: z.string().min(20).max(15_000_000),
  garmentImage: z.string().min(20).max(15_000_000),
  description: z.string().min(2).max(200),
  consent: z.literal(true),
});

export const bodySwap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => BodySwapSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await supabaseAdmin.from("consents").insert({
      user_id: userId,
      consent_type: "face_swap_subject_permission",
      version: "v1",
    });

    const [person, garment] = await Promise.all([
      uploadDataUrl(userId, data.personImage, "inputs"),
      uploadDataUrl(userId, data.garmentImage, "inputs"),
    ]);

    const result = await falRun("fal-ai/idm-vton", {
      human_image_url: person.url,
      garment_image_url: garment.url,
      description: data.description,
    });
    const out = (result.image as { url?: string } | undefined)?.url;
    if (!out) throw new Error("Body swap returned no image");

    const stored = await downloadToStorage(out, userId, "png", "image/png");

    const { data: row } = await supabaseAdmin
      .from("generations")
      .insert({
        user_id: userId,
        tool: "body_swap",
        prompt: data.description,
        model: "fal-ai/idm-vton",
        input_asset_paths: [person.path, garment.path],
        output_asset_path: stored.path,
        status: "completed",
      })
      .select("id")
      .single();

    return { id: row?.id, imageUrl: stored.url };
  });

// ─── Model Training (Replicate LoRA) ────────────────────────────────────────
const TrainSchema = z.object({
  triggerWord: z.string().min(2).max(40).regex(/^[A-Za-z0-9_]+$/),
  zipDataUrl: z.string().min(50).max(60_000_000), // ~45MB cap
  consent: z.literal(true),
});

export const trainModel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => TrainSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await supabaseAdmin.from("consents").insert({
      user_id: userId,
      consent_type: "training_ownership",
      version: "v1",
    });

    // Upload the zip to storage and get a signed URL
    const match = /^data:(application\/zip|application\/x-zip-compressed);base64,(.*)$/.exec(data.zipDataUrl);
    if (!match) throw new Error("Please upload a .zip file of training images.");
    const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
    const path = `${userId}/training/${crypto.randomUUID()}.zip`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("generations")
      .upload(path, bytes, { contentType: "application/zip" });
    if (upErr) throw upErr;
    const { data: signed } = await supabaseAdmin.storage
      .from("generations")
      .createSignedUrl(path, 60 * 60 * 6);
    const zipUrl = signed?.signedUrl;
    if (!zipUrl) throw new Error("Could not prepare training data");

    // Kick off Replicate training (long-running, do NOT wait)
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) throw new Error("Replicate not configured");
    const res = await fetch(
      `https://api.replicate.com/v1/models/ostris/flux-dev-lora-trainer/versions/e440909d3512c31646ee2e0c7d6f6f4923224863a6a10c494606e79fb5844497/trainings`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: `${process.env.REPLICATE_USERNAME ?? "lovable"}/tai-${userId.slice(0, 8)}-${Date.now()}`,
          input: {
            input_images: zipUrl,
            trigger_word: data.triggerWord,
            steps: 1000,
          },
        }),
      },
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Training failed to start (${res.status}). Tip: set REPLICATE_USERNAME secret to your Replicate account name. ${text.slice(0, 200)}`);
    }
    const job = (await res.json()) as { id: string; status: string };

    await supabaseAdmin.from("generations").insert({
      user_id: userId,
      tool: "model_training",
      prompt: data.triggerWord,
      model: "ostris/flux-dev-lora-trainer",
      input_asset_paths: [path],
      status: "processing",
      moderation_result: { training_id: job.id },
    });

    return { trainingId: job.id, status: job.status };
  });
