import { createFileRoute } from "@tanstack/react-router";
import { HfMediaPanel } from "@/components/HfMediaPanel";

export const Route = createFileRoute("/_authenticated/video")({
  head: () => ({ meta: [{ title: "AI Video — T_AI Studio" }] }),
  component: VideoPage,
});

function VideoPage() {
  return (
    <div className="space-y-4">
      <header className="pt-2">
        <h1 className="font-display text-2xl font-bold">AI Video</h1>
        <p className="text-sm text-muted-foreground">Describe a short video and we'll generate it.</p>
      </header>
      <HfMediaPanel
        kind="video"
        title="Text to video"
        desc="Powered by your Hugging Face Space (Open-Sora / CogVideoX / Wan)."
        promptLabel="Prompt"
        showDuration
        outputType="video"
      />
      <p className="text-xs text-muted-foreground">
        Configure <code>HF_VIDEO_URL</code> in project secrets to point at your Space.
      </p>
    </div>
  );
}
