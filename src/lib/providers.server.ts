import { supabaseAdmin } from "@/integrations/supabase/client.server";

const REPLICATE_URL = "https://api.replicate.com/v1";

export async function replicateRun(modelRef: string, input: Record<string, unknown>, timeoutSec = 240): Promise<unknown> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("Replicate not configured");
  const headers = { Authorization: `Bearer ${token}` } as Record<string, string>;

  let version: string;
  if (modelRef.includes(":")) {
    version = modelRef.split(":")[1];
  } else {
    const r = await fetch(`${REPLICATE_URL}/models/${modelRef}`, { headers });
    if (!r.ok) throw new Error(`Replicate model lookup ${r.status}: ${await r.text()}`);
    const data = (await r.json()) as { latest_version?: { id: string } };
    if (!data.latest_version?.id) throw new Error("Replicate model has no version");
    version = data.latest_version.id;
  }

  const create = await fetch(`${REPLICATE_URL}/predictions`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json", Prefer: "wait=60" },
    body: JSON.stringify({ version, input }),
  });
  if (!create.ok) throw new Error(`Replicate create ${create.status}: ${await create.text()}`);
  let pred = (await create.json()) as { id: string; status: string; output?: unknown; error?: string };

  const start = Date.now();
  while ((pred.status === "starting" || pred.status === "processing") && (Date.now() - start) / 1000 < timeoutSec) {
    await new Promise((r) => setTimeout(r, 2500));
    const r2 = await fetch(`${REPLICATE_URL}/predictions/${pred.id}`, { headers });
    pred = (await r2.json()) as typeof pred;
  }
  if (pred.status !== "succeeded") {
    throw new Error(`Replicate ${pred.status}: ${pred.error ?? "timeout or failed"}`);
  }
  return pred.output;
}

export async function falRun(model: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error("fal.ai not configured");
  const res = await fetch(`https://fal.run/${model}`, {
    method: "POST",
    headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`fal ${res.status}: ${await res.text()}`);
  return (await res.json()) as Record<string, unknown>;
}

export async function uploadDataUrl(
  userId: string,
  dataUrl: string,
  folder = "inputs",
): Promise<{ path: string; url: string }> {
  if (!dataUrl.startsWith("data:")) throw new Error("Invalid image upload");
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/.exec(dataUrl);
  if (!match) throw new Error("Invalid image data URL");
  const contentType = match[1];
  const ext = contentType.split("/")[1].replace("jpeg", "jpg");
  const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabaseAdmin.storage.from("generations").upload(path, bytes, { contentType });
  if (error) throw error;
  const { data } = await supabaseAdmin.storage.from("generations").createSignedUrl(path, 60 * 60);
  return { path, url: data?.signedUrl ?? "" };
}

export async function downloadToStorage(
  remoteUrl: string,
  userId: string,
  ext: string,
  contentType: string,
): Promise<{ path: string; url: string }> {
  const r = await fetch(remoteUrl);
  if (!r.ok) throw new Error(`Download failed ${r.status}`);
  const buf = new Uint8Array(await r.arrayBuffer());
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabaseAdmin.storage.from("generations").upload(path, buf, { contentType });
  if (error) throw error;
  const { data } = await supabaseAdmin.storage.from("generations").createSignedUrl(path, 60 * 60 * 24 * 7);
  return { path, url: data?.signedUrl ?? remoteUrl };
}