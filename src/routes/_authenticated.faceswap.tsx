import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { Loader2, Upload, X, Users, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { faceSwap } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/faceswap")({
  head: () => ({ meta: [{ title: "Face Swap — T_AI Studio" }] }),
  component: FaceSwapPage,
});

function FaceSwapPage() {
  const [target, setTarget] = useState<string | null>(null);
  const [face, setFace] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const targetRef = useRef<HTMLInputElement>(null);
  const faceRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const run = useServerFn(faceSwap);

  const mut = useMutation({
    mutationFn: async () => {
      if (!target || !face) throw new Error("Upload both photos.");
      return run({ data: { targetImage: target, faceImage: face, consent: true } });
    },
    onSuccess: (r) => {
      if (r?.imageUrl) setResult(r.imageUrl);
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold">Face Swap</h1>
        <p className="text-sm text-muted-foreground">Place a face from one photo onto another.</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Slot label="Target photo" hint="The scene" file={target} onPick={setTarget} inputRef={targetRef} />
        <Slot label="Face photo" hint="The face to use" file={face} onPick={setFace} inputRef={faceRef} />
      </div>

      <label className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
        <Checkbox checked={consent} onCheckedChange={(v) => setConsent(Boolean(v))} className="mt-0.5" />
        <span className="text-muted-foreground">
          I have permission from the individual whose face is being uploaded. Misuse violates our{" "}
          <a href="/legal/acceptable-use" className="text-primary underline">Acceptable Use</a> policy.
        </span>
      </label>

      <Button
        className="h-12 w-full text-base"
        disabled={!target || !face || !consent || mut.isPending}
        onClick={() => mut.mutate()}
      >
        {mut.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Swapping…</> : <><Users className="mr-2 h-4 w-4" /> Run face swap</>}
      </Button>

      <div className="aspect-square w-full overflow-hidden rounded-2xl border border-border bg-card">
        {result ? (
          <img src={result} alt="Face swap result" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {mut.isPending ? "Working on it…" : "Your result will appear here"}
          </div>
        )}
      </div>
      {result && (
        <a href={result} download="faceswap.png" className="inline-flex items-center gap-2 text-sm text-primary underline">
          <Download className="h-4 w-4" /> Download
        </a>
      )}
    </div>
  );
}

function Slot({
  label, hint, file, onPick, inputRef,
}: {
  label: string; hint: string; file: string | null;
  onPick: (d: string | null) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  function read(f?: File) {
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) { toast.error("Image must be under 8MB."); return; }
    const reader = new FileReader();
    reader.onload = () => onPick(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(f);
  }
  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => read(e.target.files?.[0])} />
      {file ? (
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-card">
          <img src={file} alt={label} className="h-full w-full object-cover" />
          <button onClick={() => onPick(null)} className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 backdrop-blur">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card p-3 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground"
        >
          <Upload className="h-5 w-5" />
          <span className="font-medium">{label}</span>
          <span className="text-[11px]">{hint}</span>
        </button>
      )}
    </div>
  );
}