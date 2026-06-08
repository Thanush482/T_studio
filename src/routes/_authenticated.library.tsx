import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ImageIcon, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({ meta: [{ title: "Library — T_AI Studio" }] }),
  component: LibraryPage,
});

type Gen = { id: string; prompt: string; output_asset_path: string | null; output_url: string | null; created_at: string };

function LibraryPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["library"],
    queryFn: async (): Promise<Array<Gen & { signedUrl: string | null }>> => {
      const { data: rows } = await supabase
        .from("generations")
        .select("id, prompt, output_asset_path, output_url, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      const list = (rows ?? []) as Gen[];
      const withUrls = await Promise.all(
        list.map(async (g) => {
          if (g.output_url) return { ...g, signedUrl: g.output_url };
          if (!g.output_asset_path) return { ...g, signedUrl: null };
          const { data: s } = await supabase.storage
            .from("generations")
            .createSignedUrl(g.output_asset_path, 60 * 60);
          return { ...g, signedUrl: s?.signedUrl ?? null };
        }),
      );
      return withUrls;
    },
  });

  async function reusePrompt(prompt: string) {
    sessionStorage.setItem("tai:reuse-prompt", prompt);
    navigate({ to: "/create" });
  }

  async function editThis(url: string | null, prompt: string) {
    if (!url) return toast.error("Image not available");
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          sessionStorage.setItem("tai:reuse-image", reader.result);
          sessionStorage.setItem("tai:reuse-prompt", prompt);
          navigate({ to: "/edit" });
        }
      };
      reader.readAsDataURL(blob);
    } catch {
      toast.error("Could not load that image");
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Library</h1>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="aspect-square animate-shimmer" />
              <div className="mx-2 my-2 h-3 w-3/4 rounded bg-muted animate-shimmer" />
            </div>
          ))}
        </div>
      ) : !data?.length ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center animate-fade-in">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No creations yet. Head to Create to make your first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {data.map((g, i) => (
            <div key={g.id} className="overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_16px_-4px_oklch(0.62_0.24_295/0.15)]" style={{ animation: `fade-in 0.4s ease-out ${i * 80}ms both` }}>
              <div className="aspect-square bg-muted">
                {g.signedUrl ? (
                  <div className="relative h-full w-full">
                    <img src={g.signedUrl} alt={g.prompt} className="h-full w-full object-cover" loading="lazy" />
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium text-foreground backdrop-blur">
                      AI-generated
                    </span>
                  </div>
                ) : null}
              </div>
              <p className="line-clamp-2 px-2 py-1.5 text-[11px] text-muted-foreground">{g.prompt}</p>
              <div className="flex gap-1 border-t border-border p-1.5">
                <button
                  onClick={() => reusePrompt(g.prompt)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary"
                >
                  <Sparkles className="h-3 w-3" /> Reuse
                </button>
                <button
                  onClick={() => editThis(g.signedUrl, g.prompt)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary"
                >
                  <Wand2 className="h-3 w-3" /> Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}