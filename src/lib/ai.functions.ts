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

export const generateImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway not configured");

    // 1. Credit check
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("credits, tier")
      .eq("user_id", userId)
      .single();
    if (!profile || profile.credits <= 0) {
      throw new Error("You're out of credits. Upgrade your plan to keep creating.");
    }

    // 2. Moderation
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
      content_type: "prompt",
      verdict: blocked ? "blocked" : "allowed",
      model: "google/gemini-2.5-flash-lite",
      raw: { prompt: data.prompt, response: verdict },
    });

    if (blocked) {
      throw new Error("This prompt violates our safety policy. Please try a different idea.");
    }

    // 3. Generate
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

    // 4. Record generation + decrement credit
    const { data: row } = await supabaseAdmin
      .from("generations")
      .insert({
        user_id: userId,
        kind: "text_to_image",
        prompt: data.prompt,
        model: "google/gemini-2.5-flash-image",
        storage_path: b64 ? fileName : null,
        status: "completed",
        metadata: { has_watermark: true },
      })
      .select("id")
      .single();

    await supabaseAdmin.from("credit_ledger").insert({
      user_id: userId,
      delta: -1,
      reason: "text_to_image",
      generation_id: row?.id ?? null,
    });

    return {
      id: row?.id,
      imageUrl: storageUrl ?? url ?? (b64 ? `data:image/png;base64,${b64}` : null),
    };
  });