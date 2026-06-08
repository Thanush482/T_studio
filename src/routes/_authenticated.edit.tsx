import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Loader2, Download, Wand2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { editImage } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/edit")({
  head: () => ({ meta: [{ title: "Edit — T_AI Studio" }] }),
  component: EditPage,
});

const SUGGESTIONS = [
  "Replace the background with a sunset beach",
  "Make it a watercolor painting",
  "Add soft cinematic lighting",
];

function EditPage() {
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [sourceDataUrl, setSourceDataUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const runEdit = useServerFn(editImage);

  useEffect(() => {
    const reuseImg = sessionStorage.getItem("tai:reuse-image");
    const reusePrompt = sessionStorage.getItem("tai:reuse-prompt");
    if (reuseImg) {
      setSourceDataUrl(reuseImg);
      sessionStorage.removeItem("tai:reuse-image");
    }
    if (reusePrompt) {
      setPrompt(reusePrompt);
      sessionStorage.removeItem("tai:reuse-prompt");
    }
  }, []);

  const mutation = useMutation({
    mutationFn: async (p: string) => {
      if (!sourceDataUrl) throw new Error("Upload a photo to edit first.");
      return runEdit({ data: { prompt: p, imageDataUrl: sourceDataUrl } });
    },
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

  function onPickFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be under 8MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setSourceDataUrl(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold">Edit photo</h1>
        <p className="text-sm text-muted-foreground">
          Upload a photo and describe how to transform it.
        </p>
      </header>

      <div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onPickFile(e.target.files?.[0])}
        />
        {sourceDataUrl ? (
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
            <img src={sourceDataUrl} alt="Source upload" className="max-h-64 w-full object-contain" />
            <button
              onClick={() => setSourceDataUrl(null)}
              className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 text-foreground backdrop-blur"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card py-10 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground"
          >
            <Upload className="h-6 w-6" />
            Tap to upload a photo
            <span className="text-[11px]">JPG / PNG · up to 8MB</span>
          </button>
        )}
      </div>

      <Textarea
        placeholder="Change the background to a snowy mountain…"
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
        disabled={mutation.isPending || prompt.trim().length < 3 || !sourceDataUrl}
        className="h-12 w-full text-base"
      >
        {mutation.isPending ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Editing…</>
        ) : (
          <><Wand2 className="mr-2 h-4 w-4" /> Edit photo</>
        )}
      </Button>

      <div className="aspect-square w-full overflow-hidden rounded-2xl border border-border bg-card">
        {image ? (
          <img src={image} alt="Edited artwork" className="h-full w-full object-cover animate-fade-in" />
        ) : mutation.isPending ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <div className="h-16 w-16 animate-shimmer rounded-xl" />
            <p className="text-sm text-muted-foreground">Working on it…</p>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Your edited image will appear here
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
