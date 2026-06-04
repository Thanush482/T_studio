import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { Loader2, Upload, X, Brain } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { trainModel } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/train")({
  head: () => ({ meta: [{ title: "Train AI Model — T_AI Studio" }] }),
  component: TrainPage,
});

function TrainPage() {
  const [zipName, setZipName] = useState<string | null>(null);
  const [zipData, setZipData] = useState<string | null>(null);
  const [trigger, setTrigger] = useState("");
  const [consent, setConsent] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const run = useServerFn(trainModel);

  const mut = useMutation({
    mutationFn: async () => {
      if (!zipData) throw new Error("Upload a .zip of training images.");
      return run({ data: { zipDataUrl: zipData, triggerWord: trigger, consent: true } });
    },
    onSuccess: () => toast.success("Training started. We'll notify you when it's ready (typically 20–40 min)."),
    onError: (e: Error) => toast.error(e.message),
  });

  function pick(f?: File) {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".zip")) { toast.error("Please upload a .zip file."); return; }
    if (f.size > 45 * 1024 * 1024) { toast.error("Zip must be under 45MB."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") { setZipData(reader.result); setZipName(f.name); }
    };
    reader.readAsDataURL(f);
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold">Train your AI model</h1>
        <p className="text-sm text-muted-foreground">Upload 10–20 photos of one subject. Training takes 20–40 minutes.</p>
      </header>

      <input ref={fileRef} type="file" accept=".zip,application/zip" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />

      {zipData ? (
        <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 text-sm">
          <span className="truncate">{zipName}</span>
          <button onClick={() => { setZipData(null); setZipName(null); }}>
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card py-10 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground"
        >
          <Upload className="h-6 w-6" />
          Upload training images (.zip)
          <span className="text-[11px]">10–20 photos · under 45MB</span>
        </button>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Trigger word</label>
        <Input
          value={trigger}
          onChange={(e) => setTrigger(e.target.value.replace(/[^A-Za-z0-9_]/g, ""))}
          placeholder="e.g. mysubject"
          maxLength={40}
        />
        <p className="mt-1 text-[11px] text-muted-foreground">Use this word in prompts to summon your model.</p>
      </div>

      <label className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
        <Checkbox checked={consent} onCheckedChange={(v) => setConsent(Boolean(v))} className="mt-0.5" />
        <span className="text-muted-foreground">
          I confirm I own the rights to these images or have permission from the subject.
        </span>
      </label>

      <Button
        className="h-12 w-full text-base"
        disabled={!zipData || trigger.length < 2 || !consent || mut.isPending}
        onClick={() => mut.mutate()}
      >
        {mut.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting training…</> : <><Brain className="mr-2 h-4 w-4" /> Start training</>}
      </Button>
    </div>
  );
}