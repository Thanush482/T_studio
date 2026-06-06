import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Sparkles, Loader2, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateImage } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/create")({
  head: () => ({ meta: [{ title: "Create — T_AI Studio" }] }),
  component: CreatePage,
});

const SUGGESTIONS = [
  "A neon cyberpunk fox sitting on a Tokyo rooftop at night",
  "Minimalist product shot of a glass perfume bottle on marble",
  "Watercolor portrait of a mountain village at sunrise",
];

function CreatePage() {
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const runGen = useServerFn(generateImage);

  const mutation = useMutation({
    mutationFn: async (p: string) => runGen({ data: { prompt: p } }),
    onSuccess: (res) => {
      if (res && "error" in res && res.error) {
        toast.error(res.error);
        return;
      }
      if (res?.imageUrl) setImage(res.imageUrl);
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold">Create</h1>
        <p className="text-sm text-muted-foreground">
          Describe an image. We&apos;ll generate it.
        </p>
      </header>

      <Textarea
        placeholder="A cinematic shot of…"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={4}
        className="resize-none text-base"
      />

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setPrompt(s)}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground"
          >
            {s.length > 32 ? `${s.slice(0, 32)}…` : s}
          </button>
        ))}
      </div>

      <Button
        onClick={() => mutation.mutate(prompt.trim())}
        disabled={mutation.isPending || prompt.trim().length < 3}
        className="h-12 w-full text-base"
      >
        {mutation.isPending ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…</>
        ) : (
          <><Sparkles className="mr-2 h-4 w-4" /> Generate</>
        )}
      </Button>

      <div className="aspect-square w-full overflow-hidden rounded-2xl border border-border bg-card">
        {image ? (
          <img src={image} alt="Generated artwork" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {mutation.isPending ? "Working on it…" : "Your image will appear here"}
          </div>
        )}
      </div>

      {image && (
        <a href={image} download="tai-studio.png" className="inline-flex items-center gap-2 text-sm text-primary underline">
          <Download className="h-4 w-4" /> Download
        </a>
      )}

      <p className="text-center text-[11px] text-muted-foreground">
        All content is AI-generated and watermarked. Misuse violates our Terms.
      </p>
    </div>
  );
}
