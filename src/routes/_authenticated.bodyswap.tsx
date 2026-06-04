import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { Loader2, Upload, X, Shirt, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { bodySwap } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/bodyswap")({
  head: () => ({ meta: [{ title: "Outfit Swap — T_AI Studio" }] }),
  component: BodySwapPage,
});

function BodySwapPage() {
  const [person, setPerson] = useState<string | null>(null);
  const [garment, setGarment] = useState<string | null>(null);
  const [desc, setDesc] = useState("a stylish outfit");
  const [consent, setConsent] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const personRef = useRef<HTMLInputElement>(null);
  const garmentRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const run = useServerFn(bodySwap);

  const mut = useMutation({
    mutationFn: async () => {
      if (!person || !garment) throw new Error("Upload both photos.");
      return run({ data: { personImage: person, garmentImage: garment, description: desc, consent: true } });
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
        <h1 className="font-display text-2xl font-bold">Outfit Swap</h1>
        <p className="text-sm text-muted-foreground">Try a garment on a model photo.</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Slot label="Person" hint="Full-body photo" file={person} onPick={setPerson} inputRef={personRef} />
        <Slot label="Garment" hint="Clothing item" file={garment} onPick={setGarment} inputRef={garmentRef} />
      </div>

      <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Brief garment description" />

      <label className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
        <Checkbox checked={consent} onCheckedChange={(v) => setConsent(Boolean(v))} className="mt-0.5" />
        <span className="text-muted-foreground">
          I have permission to use the person photo and rights to the garment image.
        </span>
      </label>

      <Button
        className="h-12 w-full text-base"
        disabled={!person || !garment || !consent || desc.length < 2 || mut.isPending}
        onClick={() => mut.mutate()}
      >
        {mut.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Swapping…</> : <><Shirt className="mr-2 h-4 w-4" /> Run outfit swap</>}
      </Button>

      <div className="aspect-square w-full overflow-hidden rounded-2xl border border-border bg-card">
        {result ? (
          <img src={result} alt="Result" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {mut.isPending ? "Working on it…" : "Your result will appear here"}
          </div>
        )}
      </div>
      {result && (
        <a href={result} download="outfit.png" className="inline-flex items-center gap-2 text-sm text-primary underline">
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