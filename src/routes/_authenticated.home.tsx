import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, ImageIcon, Wand2, Users, Shirt, Film, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FadeIn } from "@/components/FadeIn";

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
      <FadeIn delay={0}>
        <header className="pt-2">
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="font-display text-2xl font-bold">{profile?.display_name ?? "Creator"}</h1>
        </header>
      </FadeIn>

      <FadeIn delay={100}>
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/20 via-card to-accent/10 p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Free preview</p>
          <p className="font-display text-2xl font-bold">Create without limits</p>
          <p className="mt-1 text-sm text-muted-foreground">All tools are free while we're in preview.</p>
        </div>
      </FadeIn>

      <section>
        <FadeIn delay={150}>
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Create
          </h2>
        </FadeIn>
        <div className="grid grid-cols-2 gap-3">
          {[
            { to: "/create" as const, icon: <Sparkles className="h-6 w-6" />, title: "Text to Image", desc: "Describe an image" },
            { to: "/edit" as const, icon: <Wand2 className="h-6 w-6" />, title: "Edit with prompt", desc: "Transform a photo" },
            { comingSoon: true, icon: <Users className="h-6 w-6" />, title: "Face Swap", desc: "Swap faces in photos" },
            { comingSoon: true, icon: <Shirt className="h-6 w-6" />, title: "Outfit Swap", desc: "Try-on a garment" },
            { comingSoon: true, icon: <Film className="h-6 w-6" />, title: "AI Video", desc: "Text to short video" },
            { comingSoon: true, icon: <Brain className="h-6 w-6" />, title: "Train model", desc: "Your own AI subject" },
            { to: "/library" as const, icon: <ImageIcon className="h-6 w-6" />, title: "Your library", desc: "All your creations" },
            { to: "/profile" as const, icon: <Sparkles className="h-6 w-6" />, title: "Profile", desc: "Account & legal" },
          ].map((tile, i) => (
            <FadeIn key={tile.title} delay={200 + i * 60}>
              {"comingSoon" in tile ? (
                <div className="group rounded-2xl border border-border bg-card p-4 opacity-60">
                  <TileBody icon={tile.icon} title={tile.title} desc={tile.desc} comingSoon />
                </div>
              ) : (
                <Link to={tile.to!} className="group block rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/50 hover:bg-card/80 hover:shadow-[0_0_24px_-4px_oklch(0.62_0.24_295/0.2)]">
                  <TileBody icon={tile.icon} title={tile.title} desc={tile.desc} />
                </Link>
              )}
            </FadeIn>
          ))}
        </div>
      </section>
    </div>
  );
}

function TileBody({
  icon,
  title,
  desc,
  comingSoon,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  comingSoon?: boolean;
}) {
  return (
    <>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary transition-transform duration-300 group-hover:scale-110">{icon}</div>
      <p className="font-display text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
      {comingSoon && (
        <span className="mt-2 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Coming soon
        </span>
      )}
    </>
  );
}