import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { HfMediaPanel } from "@/components/HfMediaPanel";
import { ImageIcon, Film } from "lucide-react";

export const Route = createFileRoute("/_authenticated/faceswap")({
  head: () => ({
    meta: [
      { title: "Face Swap — T_AI Studio" },
      { name: "description", content: "Swap faces in images and videos with AI." },
    ],
  }),
  component: FaceSwapPage,
});

function FaceSwapPage() {
  return (
    <div className="space-y-6">
      <header className="pt-2">
        <p className="text-sm text-muted-foreground">Face Swap</p>
        <h1 className="font-display text-2xl font-bold">Swap faces in photos & video</h1>
      </header>

      <Tabs defaultValue="img">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="img"><ImageIcon className="mr-1 h-4 w-4" />Image</TabsTrigger>
          <TabsTrigger value="vid"><Film className="mr-1 h-4 w-4" />Video</TabsTrigger>
        </TabsList>

        <TabsContent value="img" className="mt-4">
          <HfMediaPanel
            kind="faceswap-img"
            title="Image Face Swap"
            desc="Powered by your Hugging Face InsightFace / ReActor Space."
            sourceLabel="Source face image"
            sourceAccept="image/*"
            refLabel="Target image"
            refAccept="image/*"
            outputType="image"
          />
        </TabsContent>

        <TabsContent value="vid" className="mt-4">
          <HfMediaPanel
            kind="faceswap-vid"
            title="Video Face Swap"
            desc="Powered by your Hugging Face Roop / FaceFusion Space. Larger videos take longer."
            sourceLabel="Source face image"
            sourceAccept="image/*"
            refLabel="Target video"
            refAccept="video/*"
            outputType="video"
          />
        </TabsContent>
      </Tabs>

      <p className="rounded-xl border border-border bg-card p-3 text-xs text-muted-foreground">
        By using face swap, you confirm you have permission from the individual whose face is being uploaded.
      </p>
    </div>
  );
}
