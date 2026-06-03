import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ImageIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({ meta: [{ title: "Library — T_AI Studio" }] }),
  component: LibraryPage,
});

type Gen = { id: string; prompt: string; output_asset_path: string | null; output_url: string | null; created_at: string };

function LibraryPage() {
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

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Library</h1>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data?.length ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No creations yet. Head to Create to make your first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {data.map((g) => (
            <div key={g.id} className="overflow-hidden rounded-xl border border-border bg-card">
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}