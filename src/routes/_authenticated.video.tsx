import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload, Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/video")({
  head: () => ({ meta: [{ title: "AI Video — T_AI Studio" }] }),
  component: VideoPage,
});

function VideoPage() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewKind, setPreviewKind] = useState<"image" | "video" | null>(null);
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(4);
  const [apiName, setApiName] = useState("/predict");
  const [busy, setBusy] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  // Pick up reuse payload from Library ("Use in Video")
  useEffect(() => {
    const dataUrl = sessionStorage.getItem("tai:video-source");
    const savedPrompt = sessionStorage.getItem("tai:reuse-prompt");
    if (savedPrompt) {
      setPrompt(savedPrompt);
      sessionStorage.removeItem("tai:reuse-prompt");
    }
    if (dataUrl) {
      sessionStorage.removeItem("tai:video-source");
      (async () => {
        try {
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          const ext = blob.type.startsWith("video/") ? "mp4" : "png";
          const f = new File([blob], `library-source.${ext}`, { type: blob.type });
          applyFile(f);
        } catch {
          toast.error("Could not load library item");
        }
      })();
    }
  }, []);

  function applyFile(f: File | null) {
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (!f) {
      setPreviewUrl(null);
      setPreviewKind(null);
      return;
    }
    setPreviewUrl(URL.createObjectURL(f));
    setPreviewKind(f.type.startsWith("video/") ? "video" : "image");
  }

  async function run() {
    if (!prompt.trim()) return toast.error("Please enter a prompt.");
    setBusy(true);
    setResultUrl(null);
    try {
      const fd = new FormData();
      fd.append("kind", "video");
      fd.append("apiName", apiName || "/predict");
      fd.append("prompt", prompt);
      if (file) fd.append("file", file);
      fd.append("extra", JSON.stringify({ duration }));
      const res = await fetch("/api/hf", { method: "POST", body: fd });
      if (!res.ok) throw new Error((await res.text()) || `Failed (${res.status})`);
      const json = (await res.json()) as { mediaUrl?: string; error?: string };
      if (!json.mediaUrl) throw new Error(json.error || "No video returned");
      setResultUrl(json.mediaUrl);
      toast.success("Video ready");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <header className="pt-2">
        <h1 className="font-display text-2xl font-bold">AI Video</h1>
        <p className="text-sm text-muted-foreground">
          Generate from a prompt, or transform an image/video with a prompt.
        </p>
      </header>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Source (optional — image or video)</label>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-1 h-3 w-3" /> Choose file
            </Button>
            <span className="truncate text-xs text-muted-foreground">{file?.name ?? "No file — text to video"}</span>
            {file && (
              <Button type="button" variant="ghost" size="sm" onClick={() => applyFile(null)}>
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => applyFile(e.target.files?.[0] ?? null)}
          />
          {previewUrl && previewKind === "image" && (
            <img src={previewUrl} alt="source" className="mt-2 max-h-48 rounded-lg" />
          )}
          {previewUrl && previewKind === "video" && (
            <video src={previewUrl} controls className="mt-2 max-h-48 rounded-lg" />
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Prompt</label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="A cinematic shot of…"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Duration (seconds)</label>
          <Input
            type="number"
            min={1}
            max={30}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value) || 4)}
          />
        </div>

        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer">Advanced</summary>
          <div className="mt-2 space-y-1">
            <label className="text-xs">Gradio API endpoint name</label>
            <Input value={apiName} onChange={(e) => setApiName(e.target.value)} placeholder="/predict" />
          </div>
        </details>

        <Button onClick={run} disabled={busy} className="w-full">
          {busy ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</>) : (<><Wand2 className="mr-2 h-4 w-4" />Generate video</>)}
        </Button>

        {resultUrl && (
          <div className="space-y-2 rounded-xl border border-border bg-background/50 p-3">
            <video src={resultUrl} controls className="w-full rounded-lg" />
            <a href={resultUrl} download className="text-xs text-primary underline">Download</a>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Configure <code>HF_VIDEO_URL</code> in project secrets to point at your Space.
        Tip: browse your <a href="/library" className="text-primary underline">Library</a> and tap
        “Use in Video” on any creation.
      </p>
    </div>
  );
}
