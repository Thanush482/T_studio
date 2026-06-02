import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, ImageIcon, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({ meta: [{ title: "Home — T_AI Studio" }] }),
  component: HomePage,
});

function HomePage() {
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("display_name").maybeSingle();
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <header className="pt-2">
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="font-display text-2xl font-bold">{profile?.display_name ?? "Creator"}</h1>
      </header>

      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/20 via-card to-accent/10 p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Free preview</p>
        <p className="font-display text-2xl font-bold">Create without limits</p>
        <p className="mt-1 text-sm text-muted-foreground">All tools are free while we're in preview.</p>
      </div>

      <section>
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Create
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Tile to="/create" icon={<Sparkles className="h-6 w-6" />} title="Text to Image" desc="Describe an image" />
          <Tile to="/create" search={{ mode: "edit" } as never} icon={<Wand2 className="h-6 w-6" />} title="Edit with prompt" desc="Transform a photo" />
          <Tile to="/library" icon={<ImageIcon className="h-6 w-6" />} title="Your library" desc="All your creations" />
          <Tile to="/profile" icon={<Sparkles className="h-6 w-6" />} title="More" desc="Coming soon" />
        </div>
      </section>
    </div>
  );
}

function Tile({ to, icon, title, desc }: { to: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link to={to} className="group rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:bg-card/80">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">{icon}</div>
      <p className="font-display text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </Link>
  );
}