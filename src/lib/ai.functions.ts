import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";

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
    const blocked = verdict.startsWith("block");

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
        model: "google/gemini-2.5-flash-image",
        prompt: watermarkedPrompt,
      }),
    });
    if (!genRes.ok) {
      if (genRes.status === 429) throw new Error("Too many requests — please slow down.");
      if (genRes.status === 402) throw new Error("AI credits exhausted. Try again later.");
      throw new Error(`Image generation failed (${genRes.status})`);
    }
    const genJson = await genRes.json();
    const b64 = genJson.data?.[0]?.b64_json as string | undefined;
    const url = genJson.data?.[0]?.url as string | undefined;

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
    const blocked = verdict.startsWith("block");

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
        model: "google/gemini-2.5-flash-image",
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
    const imageUrlOut: string | undefined =
      message?.images?.[0]?.image_url?.url ??
      message?.images?.[0]?.url ??
      undefined;

    if (!imageUrlOut) throw new Error("The model didn't return an image. Try a different prompt.");

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