import { useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Kind = "faceswap-img" | "faceswap-vid" | "train" | "video";

export function HfMediaPanel({
  kind,
  title,
  desc,
  sourceLabel,
  sourceAccept,
  refLabel,
  refAccept,
  promptLabel,
  showSteps,
  showDuration,
  outputType,
}: {
  kind: Kind;
  title: string;
  desc: string;
  sourceLabel?: string;
  sourceAccept?: string;
  refLabel?: string;
  refAccept?: string;
  promptLabel?: string;
  showSteps?: boolean;
  showDuration?: boolean;
  outputType: "image" | "video" | "file";
}) {
  const [source, setSource] = useState<File | null>(null);
  const [ref, setRef] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [apiName, setApiName] = useState("/predict");
  const [steps, setSteps] = useState(1000);
  const [duration, setDuration] = useState(4);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (sourceLabel && !source) return toast.error(`Please upload ${sourceLabel.toLowerCase()}.`);
    if (refLabel && !ref) return toast.error(`Please upload ${refLabel.toLowerCase()}.`);
    if (promptLabel && !prompt.trim() && kind === "video") return toast.error("Please enter a prompt.");
    setBusy(true);
    setMediaUrl(null);
    try {
      const fd = new FormData();
      fd.append("kind", kind);
      fd.append("apiName", apiName || "/predict");
      fd.append("prompt", prompt);
      if (source) fd.append("file", source);
      if (ref) fd.append("refFile", ref);
      if (showSteps) fd.append("extra", JSON.stringify({ steps }));
      if (showDuration) fd.append("extra", JSON.stringify({ duration }));
      const res = await fetch("/api/hf", { method: "POST", body: fd });
      if (!res.ok) throw new Error((await res.text()) || `Failed (${res.status})`);
      const json = (await res.json()) as { mediaUrl?: string; error?: string };
      if (!json.mediaUrl) throw new Error(json.error || "No media returned");
      setMediaUrl(json.mediaUrl);
      toast.success("Done");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <div>
        <h3 className="font-display text-base font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>

      {sourceLabel && (
        <FileField label={sourceLabel} accept={sourceAccept ?? "*/*"} file={source} onFile={setSource} />
      )}
      {refLabel && (
        <FileField label={refLabel} accept={refAccept ?? "*/*"} file={ref} onFile={setRef} />
      )}

      {promptLabel && (
        <div className="space-y-2">
          <label className="text-sm font-medium">{promptLabel}</label>
          <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2} />
        </div>
      )}

      {showSteps && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Training steps</label>
          <Input type="number" min={100} max={5000} value={steps} onChange={(e) => setSteps(Number(e.target.value) || 1000)} />
        </div>
      )}

      {showDuration && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Duration (seconds)</label>
          <Input type="number" min={1} max={30} value={duration} onChange={(e) => setDuration(Number(e.target.value) || 4)} />
        </div>
      )}

      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer">Advanced</summary>
        <div className="mt-2 space-y-1">
          <label className="text-xs">Gradio API endpoint name</label>
          <Input value={apiName} onChange={(e) => setApiName(e.target.value)} placeholder="/predict" />
          <p className="text-[11px]">Change if your Space exposes a different function (e.g. <code>/swap</code>, <code>/train</code>).</p>
        </div>
      </details>

      <Button onClick={run} disabled={busy} className="w-full">
        {busy ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Working…</>) : (<><Wand2 className="mr-2 h-4 w-4" />Run</>)}
      </Button>

      {mediaUrl && (
        <div className="space-y-2 rounded-xl border border-border bg-background/50 p-3">
          {outputType === "image" && <img src={mediaUrl} alt="result" className="w-full rounded-lg" />}
          {outputType === "video" && <video src={mediaUrl} controls className="w-full rounded-lg" />}
          <a href={mediaUrl} download className="text-xs text-primary underline">Download</a>
        </div>
      )}
    </div>
  );
}

function FileField({ label, accept, file, onFile }: { label: string; accept: string; file: File | null; onFile: (f: File | null) => void }) {
  const ref = useRef<HTMLInputElement | null>(null);
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex items-center gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => ref.current?.click()}>
          <Upload className="mr-1 h-3 w-3" />Choose file
        </Button>
        <span className="truncate text-xs text-muted-foreground">{file?.name ?? "No file"}</span>
      </div>
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
    </div>
  );
}