import { createFileRoute } from "@tanstack/react-router";
import { HfMediaPanel } from "@/components/HfMediaPanel";

export const Route = createFileRoute("/_authenticated/train")({
  head: () => ({
    meta: [
      { title: "Train AI Model — T_AI Studio" },
      { name: "description", content: "Train your own LoRA / DreamBooth model from 10–20 photos." },
    ],
  }),
  component: TrainPage,
});

function TrainPage() {
  return (
    <div className="space-y-6">
      <header className="pt-2">
        <p className="text-sm text-muted-foreground">Train AI Model</p>
        <h1 className="font-display text-2xl font-bold">Train your own model</h1>
      </header>

      <HfMediaPanel
        kind="train"
        title="LoRA / DreamBooth training"
        desc="Upload a .zip of 10–20 images of one subject and a trigger word. Powered by your Hugging Face Kohya_ss Space. Training can take 10–60 minutes."
        sourceLabel="Training images (.zip)"
        sourceAccept=".zip,application/zip"
        promptLabel="Trigger word (used in prompts later, e.g. 'sks person')"
        showSteps
        outputType="file"
      />

      <p className="rounded-xl border border-border bg-card p-3 text-xs text-muted-foreground">
        By uploading, you confirm you own the rights to these images and have consent from any people depicted.
      </p>
    </div>
  );
}
