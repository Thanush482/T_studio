import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Film, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateVideo } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/video")({
  head: () => ({ meta: [{ title: "AI Video — T_AI Studio" }] }),
  component: VideoPage,
});

const SUGGESTIONS = [
  "Cinematic drone shot of foggy mountains at sunrise",
  "A neon koi fish swimming through space, slow motion",
  "Time-lapse of a city skyline transitioning to night",
];

function VideoPage() {
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState<5 | 10>(5);
  const [video, setVideo] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const run = useServerFn(generateVideo);

  const mut = useMutation({
    mutationFn: (p: string) => run({ data: { prompt: p, duration } }),
    onSuccess: (r) => {
      if (r?.videoUrl) setVideo(r.videoUrl);
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold">AI Video</h1>
        <p className="text-sm text-muted-foreground">Describe a short video. We'll generate it.</p>
      </header>

      <Textarea
        placeholder="A serene timelapse of clouds drifting over mountains…"
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

      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-card p-1">
        {[5, 10].map((d) => (
          <button
            key={d}
            onClick={() => setDuration(d as 5 | 10)}
            className={`rounded-xl py-2 text-sm font-medium ${duration === d ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            {d}s
          </button>
        ))}
      </div>

      <Button
        onClick={() => mut.mutate(prompt.trim())}
        disabled={mut.isPending || prompt.trim().length < 3}
        className="h-12 w-full text-base"
      >
        {mut.isPending ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating (may take a minute)…</>
        ) : (
          <><Film className="mr-2 h-4 w-4" /> Generate video</>
        )}
      </Button>

      <div className="aspect-video w-full overflow-hidden rounded-2xl border border-border bg-card">
        {video ? (
          <video src={video} controls className="h-full w-full" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {mut.isPending ? "Working on it…" : "Your video will appear here"}
          </div>
        )}
      </div>
      {video && (
        <a href={video} download="tai-studio.mp4" className="inline-flex items-center gap-2 text-sm text-primary underline">
          <Download className="h-4 w-4" /> Download
        </a>
      )}

      <p className="text-center text-[11px] text-muted-foreground">
        All content is AI-generated and watermarked. Misuse violates our Terms.
      </p>
    </div>
  );
}